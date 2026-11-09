#!/usr/bin/env node
// Fila de merge serial (substitui a fila nativa, indisponível em conta `User`).
//
// Problema medido em 15/10/2026: com `strict=true`, cada merge na `main` deixava
// todas as PRs com auto-merge BEHIND, e o auto-update-pr-branch atualizava TODAS
// de uma vez. As N PRs recomeçavam a CI completa, só uma entrava, e as outras
// voltavam a BEHIND e recomeçavam do zero — trabalho O(N²), runners disputados
// (até 3 min de fila por job) e nenhuma PR andando mais rápido por isso.
//
// Regra desta fila:
//   1. Só uma PR "em voo" por vez (atualizada com a main e com checks rodando,
//      ou verde esperando o auto-merge disparar). Havendo uma, ninguém mais é
//      atualizado.
//   2. Sem PR em voo, atualiza só a PRÓXIMA: a BEHIND com auto-merge que habilitou
//      o auto-merge primeiro (FIFO por `enabledAt`) — ninguém volta para o fim da fila.
//   3. PR com check obrigatório falhando não é atualizada: rodaria de novo para
//      falhar de novo. Ela volta para a fila quando o autor empurrar a correção.
//
// Uso no workflow: `node scripts/ci/fila-merge.mjs` (lê `gh pr list` e grava
// `pr=<número>` em $GITHUB_OUTPUT quando há alguém a atualizar).
//
// Este script só LÊ (`gh pr list`, `gh api .../compare`): quem chama o update-branch
// é o passo seguinte do workflow, com a lista que sai daqui.

import { readFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { executadoDiretamente, resolverExecutavel } from '../lib/seguranca-processo.mjs';

const RAIZ = new URL('../../', import.meta.url);

// O `gh pr list` devolve as mais novas primeiro: lista cortada esconderia justamente a
// cabeça da fila (FIFO) e uma PR em voo antiga.
const LIMITE_PRS = 1000;
const TIMEOUT_GH_MS = 90_000;

const USO = `Uso: node scripts/ci/fila-merge.mjs [--confirmar <PR> [--recusadas "<PR> <PR>"]]

Sem argumentos: decide a próxima PR da fila e grava pr=/fila= em $GITHUB_OUTPUT.
--confirmar N   exit 0 se N ainda é a próxima da fila recalculada; 3 se não.
--recusadas     PRs que já recusaram o update-branch nesta execução (com --confirmar).
Env: GITHUB_REPOSITORY (obrigatório) e GH_TOKEN (para o gh). Exit 2 = uso inválido.
Só lê: quem atualiza a branch da PR é o workflow.`;

function erroTransitorio(err) {
  const msg = String(err?.stderr ?? err?.message ?? '');
  return /HTTP 50[234]|50[234] Bad Gateway|50[234] Service Unavailable|connection reset|ECONNRESET|ETIMEDOUT|timeout expired|unexpected end of JSON/i.test(msg);
}

export async function execComRetry(cmd, args, opts, { tentativas = 4, delaysMs = [5000, 10000, 20000] } = {}) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return execFileSync(cmd, args, opts);
    } catch (err) {
      if (!erroTransitorio(err) || i >= tentativas - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[Math.min(i, delaysMs.length - 1)]));
    }
  }
}

function protecaoDaMain() {
  const baseline = JSON.parse(readFileSync(new URL('scripts/ci/github-settings-baseline.json', RAIZ), 'utf8'));
  return baseline.branch_protection_main;
}

export function checksObrigatorios() {
  return protecaoDaMain().required_status_checks;
}

// A fila existe por causa do `strict=true`. Com `strict=false` a PR atrasada mergeia
// assim mesmo e o GitHub nunca a marca BEHIND: sobraria só o caminho do UNKNOWN (logo
// após cada push na main), que atualizaria uma PR ao acaso e reiniciaria a CI dela sem
// necessidade. Então, com `strict=false` no baseline, a fila não atualiza ninguém.
export function exigeBranchAtualizada() {
  return protecaoDaMain().strict !== false;
}

function resumoDoErro(err) {
  const ultimaDoStderr = String(err?.stderr ?? '').split('\n').map((l) => l.trim()).filter(Boolean).pop();
  return ultimaDoStderr || String(err?.message ?? err).split('\n')[0];
}

const PASSOU = new Set(['SUCCESS', 'SKIPPED', 'NEUTRAL']);
const FALHOU = new Set(['FAILURE', 'TIMED_OUT', 'STARTUP_FAILURE', 'ERROR']);

// Estado de UM check obrigatório no head da PR: 'passou' | 'falhou' | 'pendente'.
// CANCELLED e ACTION_REQUIRED contam como pendente: não são defeito do código, e
// a próxima atualização roda o check de novo.
export function estadoDoCheck(rollup, nome) {
  const entradas = (rollup ?? []).filter((c) => (c.name ?? c.context) === nome);
  if (entradas.length === 0) return 'pendente';
  // Mais de uma entrada com o mesmo nome = runs repetidos no mesmo head; vale a mais recente.
  const atual = entradas.reduce((a, b) => (String(b.startedAt ?? '') > String(a.startedAt ?? '') ? b : a));
  if (atual.__typename === 'StatusContext' || atual.state) {
    if (atual.state === 'SUCCESS') return 'passou';
    if (atual.state === 'FAILURE' || atual.state === 'ERROR') return 'falhou';
    return 'pendente';
  }
  if (atual.status !== 'COMPLETED') return 'pendente';
  if (PASSOU.has(atual.conclusion)) return 'passou';
  if (FALHOU.has(atual.conclusion)) return 'falhou';
  return 'pendente';
}

// 'fora' | 'em-voo' | 'aguardando' | 'bloqueada'
export function classificar(pr, obrigatorios) {
  if (pr.isDraft || !pr.autoMergeRequest || (pr.baseRefName && pr.baseRefName !== 'main')) return 'fora';
  if (pr.mergeStateStatus === 'DIRTY') return 'fora'; // conflito: só o autor resolve
  const estados = obrigatorios.map((n) => estadoDoCheck(pr.statusCheckRollup, n));
  if (estados.includes('falhou')) return 'bloqueada';
  // PR de fork ATRASADA fica fora: o GITHUB_TOKEN não escreve no repositório de
  // origem, então o update-branch nunca funcionaria. Fork já em dia com a main
  // continua contando como em voo (abaixo): ignorá-la deixaria outra PR ser
  // atualizada junto, e essa outra ficaria velha assim que a fork entrasse.
  if (pr.mergeStateStatus === 'BEHIND') return pr.isCrossRepository ? 'fora' : 'aguardando';
  // Atualizada com a main (CLEAN/BLOCKED/UNSTABLE/HAS_HOOKS/UNKNOWN): checks
  // rodando ou verde esperando o auto-merge — em ambos os casos ocupa a vez.
  return 'em-voo';
}

export function decidir(prs, obrigatorios) {
  const classes = prs.map((pr) => ({ pr, classe: classificar(pr, obrigatorios) }));
  const emVoo = classes.filter((c) => c.classe === 'em-voo');
  const bloqueadas = classes.filter((c) => c.classe === 'bloqueada').map((c) => c.pr.number);
  if (emVoo.length > 0) {
    return { acao: 'esperar', emVoo: emVoo.map((c) => c.pr.number), bloqueadas };
  }
  const fila = classes
    .filter((c) => c.classe === 'aguardando')
    .map((c) => c.pr)
    .sort((a, b) => {
      const ea = String(a.autoMergeRequest.enabledAt ?? '');
      const eb = String(b.autoMergeRequest.enabledAt ?? '');
      return ea === eb ? a.number - b.number : ea < eb ? -1 : 1;
    });
  if (fila.length === 0) return { acao: 'nada', bloqueadas };
  // `fila` vai inteira, em ordem: se o update-branch da primeira for recusado
  // (403/422), o workflow tenta a próxima na mesma execução em vez de travar.
  return { acao: 'atualizar', pr: fila[0].number, fila: fila.map((p) => p.number), restantes: fila.slice(1).map((p) => p.number), bloqueadas };
}

// Depois de uma recusa 403/422, o laço do workflow só tenta o próximo candidato se uma
// decisão recalculada AGORA ainda o autoriza: nenhuma PR em voo e ele é a PRIMEIRA da
// fila recalculada que ainda não foi recusada nesta execução. A lista lida no início pode
// estar velha: outra PR pode ter entrado em voo, ou uma PR mais antiga ter ficado elegível
// e passado à frente (Codex, PRs #1950 e #1951).
export function confirmarCandidato(decisao, numero, recusadas = []) {
  if (decisao.acao !== 'atualizar') return false;
  return decisao.fila.find((n) => !recusadas.includes(n)) === numero;
}

// `gh pr list` devolve mergeStateStatus=UNKNOWN enquanto o GitHub nao calculou a
// mergeabilidade (calculo assincrono). Tratar UNKNOWN como "em voo" travaria a fila;
// por isso, para PRs com auto-merge em UNKNOWN, a defasagem vem de uma comparacao
// direta (compare main...head → behind_by), que nao depende desse calculo.
export async function resolverDesconhecidos(prs, behindBy) {
  const saida = [];
  for (const pr of prs) {
    if (pr.mergeStateStatus !== 'UNKNOWN' || pr.isDraft || !pr.autoMergeRequest || !pr.headRefOid) {
      saida.push(pr);
      continue;
    }
    let atras = null;
    try {
      atras = await behindBy(pr.headRefOid);
    } catch {
      atras = null; // sem resposta: continua UNKNOWN (conservador: ocupa a vez)
    }
    saida.push(atras > 0 ? { ...pr, mergeStateStatus: 'BEHIND' } : pr);
  }
  return saida;
}

async function decisaoAtual(repo) {
  if (!exigeBranchAtualizada()) {
    return { acao: 'nada', bloqueadas: [], motivo: 'Fila desligada: a proteção da `main` está com `strict=false` (github-settings-baseline.json) — PR atrasada mergeia sem atualizar, então ninguém é atualizado.' };
  }
  let parsedPrs;
  try {
    const json = await execComRetry(resolverExecutavel('gh'), [
      'pr', 'list', '--repo', repo, '--state', 'open', '--base', 'main', '--limit', String(LIMITE_PRS),
      '--json', 'number,isDraft,isCrossRepository,baseRefName,headRefOid,autoMergeRequest,mergeStateStatus,statusCheckRollup',
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: TIMEOUT_GH_MS });
    parsedPrs = JSON.parse(json);
    if (!Array.isArray(parsedPrs)) throw new Error('a resposta não é uma lista de PRs');
  } catch (err) {
    // Sem a lista não dá para provar que ninguém está em voo: ninguém é atualizado, e o
    // resumo diz por quê (antes saía "nenhuma PR esperando", que era mentira).
    const falha = `gh pr list falhou (${resumoDoErro(err)}); nenhuma PR atualizada nesta execução.`;
    console.error(`::warning::${falha}`);
    return { acao: 'nada', bloqueadas: [], falha };
  }
  const behindBy = async (head) => Number((await execComRetry(resolverExecutavel('gh'), [
    'api', `repos/${repo}/compare/main...${head}`, '--jq', '.behind_by',
  ], { encoding: 'utf8', timeout: TIMEOUT_GH_MS })).trim());
  const prs = await resolverDesconhecidos(parsedPrs.filter((pr) => pr && typeof pr === 'object'), behindBy);
  const decisao = decidir(prs, checksObrigatorios());
  if (parsedPrs.length >= LIMITE_PRS) {
    decisao.aviso = `A lista de PRs veio cheia (${parsedPrs.length}): pode haver PR que não entrou na conta.`;
    console.error(`::warning::${decisao.aviso}`);
  }
  return decisao;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(USO);
    return;
  }
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    console.error('GITHUB_REPOSITORY ausente');
    process.exit(2);
  }
  // `--confirmar N [--recusadas "A B"]`: exit 0 se N é a próxima da fila recalculada,
  // desconsideradas as já recusadas nesta execução; 3 se não (alguém em voo, outra PR à
  // frente, N fora da fila). Não escreve output nem summary.
  const iConfirmar = process.argv.indexOf('--confirmar');
  if (iConfirmar !== -1) {
    const numero = Number(process.argv[iConfirmar + 1]);
    if (!Number.isInteger(numero) || numero <= 0) {
      console.error('--confirmar exige o número da PR');
      process.exit(2);
    }
    const iRecusadas = process.argv.indexOf('--recusadas');
    const recusadas = iRecusadas === -1 ? [] : String(process.argv[iRecusadas + 1] ?? '')
      .split(/\s+/).map(Number).filter((n) => Number.isInteger(n) && n > 0);
    const decisao = await decisaoAtual(repo);
    if (confirmarCandidato(decisao, numero, recusadas)) return;
    const motivo = decisao.falha ?? decisao.motivo
      ?? (decisao.acao === 'esperar' ? `em voo: #${decisao.emVoo.join(', #')}` : `#${numero} não é mais a próxima da fila`);
    console.log(`Fila recalculada não autoriza #${numero} (${motivo}).`);
    process.exit(3);
  }
  const decisao = await decisaoAtual(repo);
  const linhas = [];
  if (decisao.acao === 'esperar') linhas.push(`Em voo: #${decisao.emVoo.join(', #')} — ninguém mais é atualizado agora.`);
  if (decisao.acao === 'nada') linhas.push(decisao.falha ?? decisao.motivo ?? 'Nenhuma PR com auto-merge esperando atualização.');
  if (decisao.acao === 'atualizar') {
    linhas.push(`Próxima da fila: #${decisao.pr}.`);
    if (decisao.restantes.length) linhas.push(`Esperando a vez (sem gastar CI): #${decisao.restantes.join(', #')}.`);
  }
  if (decisao.bloqueadas.length) linhas.push(`Fora da fila até corrigir check obrigatório: #${decisao.bloqueadas.join(', #')}.`);
  if (decisao.aviso) linhas.push(decisao.aviso);
  for (const l of linhas) console.log(l);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Fila de merge\n\n${linhas.map((l) => `- ${l}`).join('\n')}\n`);
  if (process.env.GITHUB_OUTPUT && decisao.acao === 'atualizar') {
    // Só inteiros saem daqui: o workflow itera sobre esta lista no shell.
    const fila = decisao.fila.filter((n) => Number.isInteger(n) && n > 0).join(' ');
    appendFileSync(process.env.GITHUB_OUTPUT, `pr=${decisao.pr}\nfila=${fila}\n`);
  }
}

if (executadoDiretamente(import.meta.url)) await main();

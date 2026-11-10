#!/usr/bin/env node
// W98 — comando pronto de poda de branches (usado pelo branch-hygiene-audit.yml).
//
// O plano oferecia duas saídas: apagar sozinho ou só gerar o comando. Apagar é
// decisão do dono, então este script NUNCA apaga nada: ele escreve no relatório
// (e, por ele, na issue [branch-hygiene]) um bloco `git push origin --delete`
// pronto, um por linha, com a regra explicada.
//
// Regra de elegibilidade (todas ao mesmo tempo):
//   1. patch-equivalente à `main` (o passo anterior do workflow já calculou: zero
//      commits únicos na comparação com origin/main);
//   2. último commit da branch há MAIS de 7 dias;
//   3. nenhuma PR aberta com essa branch como head (nome igual, de qualquer repo:
//      na dúvida, a branch fica) nem como base, quando o JSON traz `baseRefName`
//      (apagar a base fecha a PR empilhada nela);
//   4. não é branch fixa do repositório (`main`, `master`, `develop`, e a `contexto`,
//      que é gerada por automação e nunca tem PR) e não é branch protegida;
//   5. o nome passa na lista de caracteres seguros. Um nome fora dela é RECUSADO,
//      não escapado: o comando vai ser colado num terminal, e nome começando com
//      `-` viraria opção do git, `$(...)`/`;`/crase viraria código do shell.
//
// Falha fechada: se a lista de PRs abertas ou de protegidas não puder ser lida, ou
// se a lista de PRs vier cheia até o limite (pode haver mais PRs que não vieram),
// ou se o `--limite-prs` informado não for um inteiro positivo, o script não gera
// comando nenhum — avisa e explica por quê.
//
// Uso:
//   node scripts/ci/branch-podaveis.mjs --equivalentes <tsv> --prs <json> \
//     --protegidas <txt> [--limite-prs N]
// <tsv>: `<branch>\t<epoch do último commit>` por linha (gerado pelo workflow).
// <json>: saída de `gh pr list --json headRefName` (ou `headRefName,baseRefName`).
// <txt>: um nome de branch protegida por linha.
// Markdown no stdout; sempre exit 0 (informativo, não bloqueia a auditoria).

import { readFileSync } from 'node:fs';
import { executadoDiretamente } from '../lib/seguranca-processo.mjs';

export const DIAS_MINIMOS = 7;
// `main` é a padrão; `master` e `develop` disparam workflows (ci.yml, ci-nexus.yml,
// security.yml); `contexto` é a branch gerada pelo contexto-ia.yml. Nenhuma entra em
// comando de poda, mesmo patch-equivalente, antiga e sem proteção cadastrada.
export const SEMPRE_FORA = new Set(['main', 'master', 'develop', 'contexto', 'HEAD']);

const USO = `Uso: node scripts/ci/branch-podaveis.mjs --equivalentes <tsv> --prs <json> --protegidas <txt> [--limite-prs N]

  --equivalentes  \`<branch>\\t<epoch do último commit>\` por linha
  --prs           saída de \`gh pr list --json headRefName\` (aceita também baseRefName)
  --protegidas    um nome de branch protegida por linha
  --limite-prs    o --limit usado no gh pr list (lista cheia = comando não gerado)

Imprime markdown no stdout e sempre sai com 0. Nunca apaga nada: só escreve o comando.
`;

// Subconjunto dos nomes que o git aceita, sem nada que o shell interprete.
const NOME_SEGURO = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/** Devolve o motivo da recusa, ou null se o nome é seguro para ir ao comando. */
export function motivoNomeInseguro(nome) {
  if (typeof nome !== 'string' || nome === '') return 'nome vazio';
  if (!NOME_SEGURO.test(nome)) return 'caractere fora de [A-Za-z0-9._/-] ou inicio invalido';
  if (nome.includes('..') || nome.includes('//') || nome.endsWith('/') || nome.endsWith('.lock')) {
    return 'forma de nome invalida para ref do git';
  }
  return null;
}

/** Representação imprimível de um nome recusado (nada nele vira markdown ou shell). */
export function nomeVisivel(nome) {
  return encodeURIComponent(String(nome));
}

/**
 * Classifica as branches patch-equivalentes.
 * @param {{ equivalentes: {branch: string, commitEpoch: number}[], prsAbertas: string[],
 *   protegidas: string[], agoraMs?: number, diasMinimos?: number }} entrada
 */
export function selecionarPodaveis({ equivalentes, prsAbertas, protegidas, agoraMs = Date.now(), diasMinimos = DIAS_MINIMOS }) {
  const comPr = new Set(prsAbertas);
  const protegida = new Set(protegidas);
  const corteMs = diasMinimos * 86_400_000;
  const elegiveis = [];
  const fora = { principal: [], protegidas: [], comPr: [], recentes: [], recusadas: [] };

  for (const { branch, commitEpoch } of equivalentes) {
    if (SEMPRE_FORA.has(branch)) { fora.principal.push(branch); continue; }
    if (protegida.has(branch)) { fora.protegidas.push(branch); continue; }
    const motivo = motivoNomeInseguro(branch);
    if (motivo) { fora.recusadas.push({ branch, motivo }); continue; }
    if (comPr.has(branch)) { fora.comPr.push(branch); continue; }
    // Epoch ausente/0/inválido: não dá para provar que é antiga -> fica de fora.
    if (!Number.isFinite(commitEpoch) || commitEpoch <= 0 || agoraMs - commitEpoch * 1000 <= corteMs) {
      fora.recentes.push(branch);
      continue;
    }
    elegiveis.push(branch);
  }
  elegiveis.sort((a, b) => a.localeCompare(b));
  return { elegiveis, fora };
}

const FIXAS = [...SEMPRE_FORA].filter((b) => b !== 'HEAD').map((b) => `\`${b}\``).join(', ');

const REGRA = `Regra: patch-equivalente à \`main\` (zero commits únicos), último commit há mais de ${DIAS_MINIMOS} dias, `
  + `nenhuma PR aberta com a branch como head, fora das branches fixas (${FIXAS}) e das protegidas, e nome só com \`[A-Za-z0-9._/-]\`. `
  + '**Nada é apagado automaticamente** (W98): rodar o bloco é decisão do dono.';

export function relatorio({ elegiveis, fora }) {
  const linhas = ['', '### Comando pronto para poda (W98)', '', REGRA, ''];
  if (elegiveis.length) {
    linhas.push(`${elegiveis.length} branch(es) elegível(is):`, '', '```sh');
    for (const b of elegiveis) linhas.push(`git push origin --delete ${b}`);
    linhas.push('```');
  } else {
    linhas.push('Nenhuma branch elegível para poda.');
  }
  const resumo = [
    ['com PR aberta', fora.comPr],
    [`com commit nos últimos ${DIAS_MINIMOS} dias`, fora.recentes],
    ['protegidas', fora.protegidas],
    ['fixas do repositório', fora.principal],
  ].filter(([, lista]) => lista.length);
  if (resumo.length || fora.recusadas.length) {
    linhas.push('', 'Patch-equivalentes deixadas fora do comando:');
    for (const [rotulo, lista] of resumo) linhas.push(`- ${rotulo}: ${lista.length}`);
    for (const { branch, motivo } of fora.recusadas) {
      linhas.push(`- nome recusado: \`${nomeVisivel(branch)}\` (${motivo}); apagar à mão, depois de conferir`);
    }
  }
  return `${linhas.join('\n')}\n`;
}

export function relatorioIndisponivel(motivo) {
  return `\n### Comando pronto para poda (W98)\n\n${REGRA}\n\nComando não gerado: ${motivo}. `
    + 'Sem essa informação não dá para provar que a branch está livre, então nenhuma entra no comando.\n';
}

/** Lê o TSV `<branch>\t<epoch>`; linha malformada vira epoch NaN (fica de fora). */
export function lerEquivalentes(texto) {
  return texto.split('\n').filter((l) => l !== '').map((linha) => {
    const tab = linha.lastIndexOf('\t');
    if (tab < 0) return { branch: linha, commitEpoch: Number.NaN };
    const bruto = linha.slice(tab + 1).trim();
    return { branch: linha.slice(0, tab), commitEpoch: bruto === '' ? Number.NaN : Number(bruto) };
  });
}

export function lerPrsAbertas(texto, limite) {
  const dados = JSON.parse(texto);
  if (!Array.isArray(dados)) throw new Error('a lista de PRs abertas não é um array');
  if (Number.isFinite(limite) && dados.length >= limite) {
    throw new Error(`a lista de PRs abertas veio cheia (${dados.length} >= limite ${limite}); pode haver PR que não veio`);
  }
  return dados.flatMap((pr) => {
    if (typeof pr?.headRefName !== 'string') throw new Error('PR sem headRefName');
    return typeof pr.baseRefName === 'string' ? [pr.headRefName, pr.baseRefName] : [pr.headRefName];
  });
}

export function lerProtegidas(texto) {
  return texto.split('\n').map((l) => l.trim()).filter(Boolean);
}

function argumentos(argv) {
  const saida = {};
  for (let i = 0; i < argv.length; i += 2) {
    const chave = argv[i];
    if (!chave?.startsWith('--') || argv[i + 1] === undefined) throw new Error(`argumento inválido: ${chave}`);
    saida[chave.slice(2)] = argv[i + 1];
  }
  for (const obrigatorio of ['equivalentes', 'prs', 'protegidas']) {
    if (!saida[obrigatorio]) throw new Error(`falta --${obrigatorio}`);
  }
  return saida;
}

export function executar(argv, ler = (p) => readFileSync(p, 'utf8'), agoraMs = Date.now()) {
  let args;
  try {
    args = argumentos(argv);
  } catch (erro) {
    return { saida: relatorioIndisponivel(erro.message), aviso: erro.message };
  }
  let equivalentes;
  let prsAbertas;
  let protegidas;
  try {
    equivalentes = lerEquivalentes(ler(args.equivalentes));
  } catch (erro) {
    return { saida: relatorioIndisponivel(`lista de patch-equivalentes ilegível (${erro.message})`), aviso: erro.message };
  }
  // Limite informado tem de ser inteiro positivo: valor inválido viraria NaN e
  // desligaria, em silêncio, a checagem de lista cheia.
  const limite = args['limite-prs'] === undefined ? Number.NaN : Number(args['limite-prs']);
  if (args['limite-prs'] !== undefined && !(Number.isInteger(limite) && limite > 0)) {
    const motivo = `--limite-prs inválido ("${args['limite-prs']}"): tem de ser inteiro positivo`;
    return { saida: relatorioIndisponivel(motivo), aviso: motivo };
  }
  try {
    prsAbertas = lerPrsAbertas(ler(args.prs), limite);
  } catch (erro) {
    return { saida: relatorioIndisponivel(`PRs abertas indisponíveis (${erro.message})`), aviso: erro.message };
  }
  try {
    protegidas = lerProtegidas(ler(args.protegidas));
  } catch (erro) {
    return { saida: relatorioIndisponivel(`branches protegidas indisponíveis (${erro.message})`), aviso: erro.message };
  }
  return { saida: relatorio(selecionarPodaveis({ equivalentes, prsAbertas, protegidas, agoraMs })) };
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(USO);
    return;
  }
  const { saida, aviso } = executar(process.argv.slice(2));
  if (aviso) console.error(`::warning::W98: comando de poda não gerado — ${aviso}`);
  process.stdout.write(saida);
}

if (executadoDiretamente(import.meta.url)) main();

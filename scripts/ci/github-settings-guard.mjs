#!/usr/bin/env node
/**
 * E13/E14 + E95: confere o perimetro do GitHub contra o baseline versionado
 * (`github-settings-baseline.json`) e restaura o que sabe restaurar.
 *
 * Política esperada: a que está no baseline, e só ela. No Loggi (tabela canônica em
 * `docs/agentes/github-ci.md`): repo privado, 9 required checks, strict=false,
 * enforce_admins=false, sem review obrigatório, allow_auto_merge=false,
 * delete_branch_on_merge=false, allowed_actions=all. Os valores e números de issue/PR
 * citados nas notas E95/W04 abaixo são a história do script no Zapp, não a política daqui.
 *
 * Uso: node scripts/ci/github-settings-guard.mjs [--dry-run] [--help]
 *   --dry-run  só leitura: não restaura nada e não abre, comenta nem fecha issue;
 *              mostra o que faria. O exit code é o mesmo do run de verdade.
 *
 * Regressão: restaura via PATCH (o que suporta) e abre/atualiza a issue
 * [settings-guard]. Tudo OK: fecha a issue se estiver aberta.
 *
 * E95 — o que mudou, e por quê: a versão anterior fazia
 * `GET /branches/main/protection` e deixava o erro subir. O `GITHUB_TOKEN` de
 * workflow NÃO tem o escopo `administration`, então esse GET responde
 * 403 "Resource not accessible by integration" — e o guard morria ali, antes de
 * comparar qualquer coisa e sem abrir a issue que deveria abrir. Medido em
 * 03/10/2026: 6 runs, 6 falhas desde a criação, zero proteção efetiva.
 *
 * Agora: campo que não dá para ler vira **não verificável** (com o motivo e o
 * que fazer), nunca falha silenciosa — e a issue é aberta de qualquer forma,
 * porque "não consegui olhar" é justamente o que precisa de gente.
 *
 * W04/W05 (plano de 14/10/2026) — o que mudou, e por quê: medido em 14/10, o
 * guard falhava 30 de 30 runs em 7 dias com "7 divergencia(s)" em `merge.*`,
 * todas `encontrado=null`. O `GET /repos` com `GITHUB_TOKEN` responde 200 mas
 * **omite** `allow_auto_merge`, `allow_squash_merge` etc. (campos que exigem
 * permissao push/admin). Campo ausente nao e divergencia: e ponto cego, e passa
 * a ser tratado como tal. E quando SO ha ponto cego (nada divergiu de fato), o
 * run sai 0 com `::warning::` e a issue recebe UM comentario por assinatura
 * (conjunto de campos cegos) a cada 7 dias — nao um a cada 6 h, que foi o que
 * levou a issue #1854 a 39 comentarios de bot e a politica E51 a ser violada.
 * Divergencia real continua saindo 1 e comentando (com dedupe de 6 h por causa).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const REPO = process.env.GITHUB_REPOSITORY || 'adm01-debug/Loggi_Flow_V2';
const TOKEN = process.env.GITHUB_TOKEN;
// W11/W12: PAT fine-grained com administration:read (secret `SETTINGS_GUARD_TOKEN` do
// environment `perimetro-leitura`) para remover o ponto cego de branch protection.
// `||`, NUNCA `??`: secret ausente chega ao processo como string VAZIA, nao `undefined`,
// e com `??` o guard mandava `Authorization: Bearer ` (401, job vermelho) em vez de
// cair no GITHUB_TOKEN. O workflow tambem passa `SETTINGS_GUARD_TOKEN || github.token`;
// a comparacao com TOKEN distingue "dedicado" de "fallback" nos dois casos.
const ADMIN_TOKEN_DEDICADO = (process.env.ADMIN_READ_TOKEN || '').trim();
const TEM_ADMIN_DEDICADO = ADMIN_TOKEN_DEDICADO !== '' && ADMIN_TOKEN_DEDICADO !== TOKEN;
let adminToken = TEM_ADMIN_DEDICADO ? ADMIN_TOKEN_DEDICADO : TOKEN;
let adminRejeitado = false;
// Loggi não tem o runbook de migração de segredos do Zapp; a rotação segue a
// regra geral de segredos do AGENTS.md ("PAT exposto em chat → rotacionar na hora").
const RUNBOOK_SEGREDOS = 'AGENTS.md (seção Postura — segredos)';
const [OWNER, REPO_NAME] = REPO.split('/');

const BASELINE_ARQUIVO = 'scripts/ci/github-settings-baseline.json';
const ISSUE_LABEL = 'settings-guard';
const ISSUE_TITLE = '[settings-guard] perimeter regression detected';
const BRANCH = 'main';
// W05: so comentarios escritos pelo proprio guard contam para o dedupe. Qualquer conta com
// acesso ao repo pode colar o marcador `<!-- causa:... -->` num comentario e, sem esta
// checagem, silenciar o alerta por 6 h / 7 dias (achado do Codex na PR #1920). O GITHUB_TOKEN
// de workflow comenta como `github-actions[bot]`; outro autor so via variavel explicita.
const AUTOR_DO_GUARD = process.env.SETTINGS_GUARD_AUTOR || 'github-actions[bot]';
const escritoPeloGuard = (registro) => registro?.user?.login === AUTOR_DO_GUARD;

// Baseline ausente ou com JSON invalido nao pode derrubar o `import` com stack trace:
// o erro fica guardado e o main() o reporta como `::error::` antes de chamar a API.
let baseline = null;
let baselineErro = null;
try {
  baseline = JSON.parse(
    readFileSync(new URL('./github-settings-baseline.json', import.meta.url), 'utf8'),
  );
} catch (e) {
  baselineErro = e.message;
}

const CHAVES_DO_BASELINE = new Set([
  'medido_em', 'repo', 'branch_protection_main', 'merge', 'actions', 'workflow_permissions',
  'security_and_analysis', 'selected_actions_patterns', 'selected_actions_verified_allowed',
  'selected_actions_github_owned_allowed', 'rulesets_count', 'environments',
  'environments_vercel_managed', 'nao_verificavel_automaticamente',
]);

/**
 * O que impede o baseline de ser usado (`erros`) e as chaves de topo que nenhuma checagem
 * le (`avisos` — quase sempre erro de digitacao, e o campo fica sem vigia sem ninguem notar).
 */
export function problemasDoBaseline(bl) {
  const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!ehObjeto(bl)) return { erros: ['o arquivo nao contem um objeto JSON'], avisos: [] };
  const erros = [];
  const bp = bl.branch_protection_main;
  if (!ehObjeto(bp)) {
    erros.push('falta o objeto `branch_protection_main`');
  } else {
    for (const campo of ['strict', 'enforce_admins']) {
      if (typeof bp[campo] !== 'boolean') erros.push(`\`branch_protection_main.${campo}\` tem de ser true ou false`);
    }
    if (!Array.isArray(bp.required_status_checks) || bp.required_status_checks.some((c) => typeof c !== 'string')) {
      erros.push('`branch_protection_main.required_status_checks` tem de ser uma lista de nomes de check');
    }
  }
  for (const chave of ['merge', 'actions']) {
    if (!ehObjeto(bl[chave]) || Object.keys(bl[chave]).length === 0) erros.push(`falta o objeto \`${chave}\``);
  }
  if (!Array.isArray(bl.environments)) erros.push('`environments` tem de ser uma lista de nomes');
  const avisos = Object.keys(bl).filter((chave) => !chave.startsWith('_') && !CHAVES_DO_BASELINE.has(chave));
  return { erros, avisos };
}

// jssecurity:S5145 — valores vindos da API do GitHub entram no log em #92/#115/#127.
// Quebras de linha / caracteres de controle são neutralizados para impedir que
// esse conteúdo forje linhas de log. Valores normais (números, booleanos) ficam iguais.
const semQuebra = (valor) => String(valor).replace(/[\r\n\u0000-\u001f\u007f]/g, ' ');

// javascript:S2871 — `.sort()` sem comparador. Ordem por código de caractere, deliberadamente
// NÃO `localeCompare`: a assinatura da causa (`assinaturaDe`) é um hash desta ordem e precisa
// ser a mesma em qualquer runner/locale; `localeCompare` muda com o ICU da máquina.
const porCodigo = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Erro de leitura por falta de escopo — não é regressão, é ponto cego. */
class NaoVerificavel extends Error {
  constructor(caminho, status, motivo) {
    super(`${status} em ${caminho}: ${motivo}`);
    this.caminho = caminho;
    this.status = status;
  }
}

/** 401: o token foi recusado (expirado, revogado ou malformado) — nao e falta de escopo. */
class TokenRecusado extends Error {
  constructor(caminho) {
    super(`401 em ${caminho}: token recusado`);
    this.caminho = caminho;
  }
}

const TIMEOUT_MS = 30_000;
const MAX_TENTATIVAS = 3;
const ESPERA_MAXIMA_MS = 60_000;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let dryRun = false;

/** Quanto esperar (ms) quando a resposta e de rate limit; null quando nao e rate limit. */
function esperaDoRateLimit(res) {
  if (res.status !== 403 && res.status !== 429) return null;
  const retryAfter = Number(res.headers.get('retry-after'));
  if (retryAfter > 0) return retryAfter * 1000;
  if (res.headers.get('x-ratelimit-remaining') === '0') {
    return Math.max(1000, Number(res.headers.get('x-ratelimit-reset')) * 1000 - Date.now());
  }
  return res.status === 429 ? ESPERA_MAXIMA_MS : null;
}

/**
 * fetch com timeout. Leitura (GET) repete ate MAX_TENTATIVAS em falha de rede, 5xx e rate
 * limit curto; escrita nunca repete (POST duplicado = comentario/issue duplicado).
 * Rate limit NUNCA vira "ponto cego": e falha transitoria, sai como erro (exit 1), senao um
 * 403 de limite passava por falta de escopo e o run saia verde sem ter olhado nada.
 */
async function fetchComRetry(method, path, init) {
  for (let tentativa = 1; ; tentativa += 1) {
    const ultima = method !== 'GET' || tentativa >= MAX_TENTATIVAS;
    let res;
    try {
      res = await fetch(`https://api.github.com${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      if (!ultima) {
        await esperar(2000 * tentativa);
        continue;
      }
      const motivo = e.name === 'TimeoutError' ? `sem resposta em ${TIMEOUT_MS / 1000}s` : (e.cause?.code ?? e.message);
      throw new Error(`GitHub API ${method} ${path} → falha de rede (${motivo}) apos ${tentativa} tentativa(s)`);
    }
    const espera = esperaDoRateLimit(res);
    if (espera !== null) {
      if (ultima || !(espera <= ESPERA_MAXIMA_MS)) {
        throw new Error(`GitHub API ${method} ${path} → rate limit (${res.status}); rode de novo mais tarde`);
      }
      console.log(`Rate limit em ${method} ${path}: nova tentativa em ${Math.ceil(espera / 1000)}s.`);
      await esperar(espera);
      continue;
    }
    if (res.status >= 500 && !ultima) {
      await esperar(2000 * tentativa);
      continue;
    }
    return res;
  }
}

async function gh(method, path, body, overrideToken) {
  const tok = overrideToken ?? TOKEN;
  if (dryRun && method !== 'GET') {
    console.log(`[dry-run] ${method} ${path} nao enviado.`);
    return { number: 'dry-run' };
  }
  const res = await fetchComRetry(method, path, {
    method,
    headers: {
      Authorization: `Bearer ${tok}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'settings-guard/2.0',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new TokenRecusado(path);
  if (res.status === 403 || res.status === 404) {
    const text = await res.text().catch(() => '');
    if (/rate limit/i.test(text)) throw new Error(`GitHub API ${method} ${path} → rate limit (${res.status}); rode de novo mais tarde`);
    // 404 aqui também costuma ser escopo, não ausência: a API esconde o recurso.
    throw new NaoVerificavel(path, res.status, text.slice(0, 200));
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json().catch(() => null);
}
// W11/W12: leituras administrativas usam o PAT fine-grained (administration:read);
// escritas (issues, PATCH de restauracao) continuam com o GITHUB_TOKEN.
// PAT recusado (401: expirou os 90 dias, foi revogado) nao derruba o guard: o resto do
// run volta ao GITHUB_TOKEN — os campos administrativos reaparecem como NAO VERIFICAVEL,
// que e o comportamento de antes do W12 — e o aviso pede a rotacao.
async function ghAdmin(method, path, body) {
  try {
    return await gh(method, path, body, adminToken);
  } catch (e) {
    if (!(e instanceof TokenRecusado) || adminToken === TOKEN) throw e;
    adminRejeitado = true;
    adminToken = TOKEN;
    console.log(
      `::warning::SETTINGS_GUARD_TOKEN recusado (401) — expirado ou revogado. Leituras administrativas voltam ao GITHUB_TOKEN neste run; rotacionar conforme ${RUNBOOK_SEGREDOS}.`,
    );
    return gh(method, path, body, adminToken);
  }
}

/** De onde vieram as leituras administrativas deste run (nunca o valor do token). */
function fonteDaLeituraAdmin() {
  if (adminRejeitado) return 'GITHUB_TOKEN (SETTINGS_GUARD_TOKEN recusado com 401 — rotacionar)';
  if (TEM_ADMIN_DEDICADO) return 'SETTINGS_GUARD_TOKEN (environment perimetro-leitura)';
  return 'GITHUB_TOKEN (SETTINGS_GUARD_TOKEN ausente — W11 pendente)';
}

// ---------------------------------------------------------------- checagens
// Cada checagem devolve { campo, esperado, encontrado } ou lança NaoVerificavel.
// `restauravel` diz se o guard sabe desfazer a divergência sozinho.

async function checarBranchProtection() {
  let protection;
  try {
    protection = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/branches/${BRANCH}/protection`);
  } catch (e) {
    // "Branch not protected" so e respondido a quem TEM acesso de leitura: e a protecao
    // inteira removida — a pior regressao —, nao ponto cego. O 404 generico ("Not Found")
    // continua sendo escopo.
    if (e instanceof NaoVerificavel && e.status === 404 && /branch not protected/i.test(e.message)) {
      return [{ campo: 'branch_protection_main', esperado: 'protegida', encontrado: 'sem protecao (Branch not protected)', restauravel: false }];
    }
    throw e;
  }
  const esperado = baseline.branch_protection_main;
  const divergencias = [];

  // W04: resposta 200 que nao e um objeto e ponto cego. Mas `required_status_checks`
  // ausente/null NAO e ponto cego: a API usa `null` para DESLIGAR os checks
  // obrigatorios (achado do Codex na PR #1920). Apagar os 6 checks tem de ser
  // regressao, nunca "campo nao lido".
  if (!protection || typeof protection !== 'object') {
    throw new NaoVerificavel(`/branches/${BRANCH}/protection`, 200, 'resposta nao e um objeto de protecao');
  }
  const checks = protection.required_status_checks ?? null;
  const checksDesligados = checks === null || typeof checks !== 'object';

  const strict = checksDesligados ? null : (checks.strict ?? null);
  if (strict !== esperado.strict) {
    divergencias.push({
      campo: 'branch_protection_main.strict',
      esperado: esperado.strict,
      encontrado: checksDesligados ? 'required_status_checks desligado' : strict,
      // Sem o bloco de checks o PATCH do sub-recurso nao tem o que atualizar.
      restauravel: !checksDesligados,
    });
  }

  const enforceAdmins = protection?.enforce_admins?.enabled ?? null;
  if (enforceAdmins !== esperado.enforce_admins) {
    divergencias.push({ campo: 'branch_protection_main.enforce_admins', esperado: esperado.enforce_admins, encontrado: enforceAdmins, restauravel: false });
  }

  const contexts = checksDesligados ? [] : [...(checks.contexts ?? [])].sort(porCodigo);
  const esperados = [...esperado.required_status_checks].sort(porCodigo);
  if (contexts.join('|') !== esperados.join('|')) {
    divergencias.push({
      campo: 'branch_protection_main.required_status_checks',
      esperado: esperados.join(', '),
      encontrado: contexts.join(', ') || '(nenhum)',
      restauravel: false,
    });
  }

  const linearHistory = protection?.required_linear_history?.enabled ?? null;
  if (linearHistory !== (esperado.required_linear_history ?? null)) {
    divergencias.push({ campo: 'branch_protection_main.required_linear_history', esperado: esperado.required_linear_history ?? null, encontrado: linearHistory, restauravel: false });
  }

  const allowForcePushes = protection?.allow_force_pushes?.enabled ?? null;
  if (allowForcePushes !== (esperado.allow_force_pushes ?? null)) {
    divergencias.push({ campo: 'branch_protection_main.allow_force_pushes', esperado: esperado.allow_force_pushes ?? null, encontrado: allowForcePushes, restauravel: false });
  }

  // Campos do perimetro do Loggi que o guard do Zapp nao olhava; so valem se o baseline os declara.
  if (Object.hasOwn(esperado, 'allow_deletions')) {
    const allowDeletions = protection?.allow_deletions?.enabled ?? null;
    if (allowDeletions !== esperado.allow_deletions) {
      divergencias.push({ campo: 'branch_protection_main.allow_deletions', esperado: esperado.allow_deletions, encontrado: allowDeletions, restauravel: false });
    }
  }
  // `null` no baseline = nenhum review obrigatorio; numero = aprovacoes exigidas.
  if (Object.hasOwn(esperado, 'required_pull_request_reviews')) {
    const reviews = protection.required_pull_request_reviews ?? null;
    const aprovacoes = reviews === null ? null : (reviews.required_approving_review_count ?? 0);
    if (aprovacoes !== esperado.required_pull_request_reviews) {
      const texto = (n) => (n === null ? '(nenhum review obrigatorio)' : `${n} aprovacao(oes) obrigatoria(s)`);
      divergencias.push({ campo: 'branch_protection_main.required_pull_request_reviews', esperado: texto(esperado.required_pull_request_reviews), encontrado: texto(aprovacoes), restauravel: false });
    }
  }

  return divergencias;
}

async function checarRepo() {
  const repo = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}`);
  if (!repo || typeof repo !== 'object') throw new NaoVerificavel('/repos', 200, 'resposta nao e um objeto de repositorio');
  const divergencias = [];
  const ausentes = [];
  // `private`/`visibility` vem para qualquer token: repo privado virar publico e pego ate
  // com o GITHUB_TOKEN de fallback, que nao enxerga os campos de merge.
  for (const [campo, esperado] of Object.entries(baseline.repo ?? {})) {
    if (campo.startsWith('_')) continue;
    const encontrado = repo?.[campo] ?? null;
    if (encontrado !== esperado) divergencias.push({ campo: `repo.${campo}`, esperado, encontrado, restauravel: false });
  }
  for (const [campo, esperado] of Object.entries(baseline.merge)) {
    // W04: o GET /repos so devolve os campos de merge para quem tem permissao
    // push/admin. Com GITHUB_TOKEN eles simplesmente NAO vem — `null`/ausente
    // aqui e "nao consegui ler", nunca "esta diferente".
    if (!repo || typeof repo !== 'object' || !Object.hasOwn(repo, campo) || repo[campo] === null) {
      ausentes.push(campo);
      continue;
    }
    const encontrado = repo[campo];
    if (encontrado !== esperado) {
      divergencias.push({ campo: `merge.${campo}`, esperado, encontrado, restauravel: campo === 'allow_auto_merge' });
    }
  }
  if (ausentes.length === Object.keys(baseline.merge).length && divergencias.length === 0) {
    throw new NaoVerificavel(`/repos (merge.*)`, 200, 'resposta sem os campos de merge: o token nao tem permissao push/admin para le-los');
  }
  if (ausentes.length > 0) {
    return { divergencias, cego: `200 — campos nao expostos ao token: ${ausentes.join(', ')}`, campos: ausentes };
  }
  // W14: security_and_analysis (secret_scanning*)
  const blSec = baseline.security_and_analysis ?? {};
  for (const [chave, valorEsperado] of Object.entries(blSec)) {
    if (chave.startsWith('_')) continue; // skip JSON comment fields
    const encontrado = repo?.security_and_analysis?.[chave]?.status ?? null;
    if (encontrado !== valorEsperado) {
      divergencias.push({ campo: `security_and_analysis.${chave}`, esperado: valorEsperado, encontrado, restauravel: false });
    }
  }
  return divergencias;
}

async function checarActions() {
  const perms = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/actions/permissions`);
  const divergencias = [];
  for (const [campo, esperado] of Object.entries(baseline.actions)) {
    const encontrado = perms?.[campo] ?? null;
    if (encontrado !== esperado) {
      divergencias.push({ campo: `actions.${campo}`, esperado, encontrado, restauravel: false });
    }
  }
  return divergencias;
}

async function checarWorkflowPermissions() {
  const perms = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/actions/permissions/workflow`);
  const divergencias = [];
  const bl = baseline.workflow_permissions ?? {};
  for (const [campo, esperado] of Object.entries(bl)) {
    if (campo.startsWith('_')) continue; // skip JSON comment fields
    const encontrado = perms?.[campo] ?? null;
    if (encontrado !== esperado) {
      divergencias.push({ campo: `workflow_permissions.${campo}`, esperado, encontrado, restauravel: false });
    }
  }
  return divergencias;
}

async function checarSelectedActions() {
  // Loggi (medido em 2026-11-08): actions.allowed_actions="all" — o endpoint
  // selected-actions só existe quando allowed_actions="selected" (409 fora disso).
  // Sem este guard o run quebra inteiro no primeiro checagens.push, antes de
  // comparar qualquer outro campo.
  if (baseline.actions?.allowed_actions !== 'selected') return [];
  const sel = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/actions/permissions/selected-actions`);
  const divergencias = [];
  const blPatterns = [...(baseline.selected_actions_patterns ?? [])].sort();
  // A API devolve padrões com `@*` (wildcard total); strip só esse sufixo.
  // `@v1`, `@sha` e similares são preservados: diferem do baseline e disparam divergência.
  const normalizar = (p) => p.replace(/@\*$/, '');
  const encontradosPatterns = [...new Set((sel?.patterns_allowed ?? []).map(normalizar))].sort();
  if (blPatterns.join('|') !== encontradosPatterns.join('|')) {
    divergencias.push({
      campo: 'selected_actions.patterns_allowed',
      esperado: blPatterns.join(', '),
      encontrado: encontradosPatterns.join(', ') || '(nenhum)',
      restauravel: false,
    });
  }
  const blVerified = baseline.selected_actions_verified_allowed ?? false;
  const encontradoVerified = sel?.verified_allowed ?? false;
  if (encontradoVerified !== blVerified) {
    divergencias.push({ campo: 'selected_actions.verified_allowed', esperado: blVerified, encontrado: encontradoVerified, restauravel: false });
  }
  const blGithubOwned = baseline.selected_actions_github_owned_allowed ?? false;
  const encontradoGithubOwned = sel?.github_owned_allowed ?? false;
  if (encontradoGithubOwned !== blGithubOwned) {
    divergencias.push({ campo: 'selected_actions.github_owned_allowed', esperado: blGithubOwned, encontrado: encontradoGithubOwned, restauravel: false });
  }
  return divergencias;
}

async function checarRulesets() {
  const rulesets = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/rulesets`);
  const divergencias = [];
  // 200 sem lista (corpo vazio, JSON invalido) nao e "zero rulesets": e resposta nao lida.
  if (!Array.isArray(rulesets)) throw new NaoVerificavel('/rulesets', 200, 'resposta nao e uma lista de rulesets');
  const esperado = baseline.rulesets_count ?? 0;
  const encontrado = rulesets.length;
  if (encontrado !== esperado) {
    divergencias.push({ campo: 'rulesets.count', esperado, encontrado, restauravel: false });
  }
  return divergencias;
}

async function checarEnvironments() {
  // per_page=100: o padrao da API e 30, e uma lista cortada viraria "environment faltando".
  const dados = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/environments?per_page=100`);
  const encontrados = (dados?.environments ?? []).map((e) => e.name).sort();
  if (Number(dados?.total_count ?? 0) > encontrados.length) {
    throw new NaoVerificavel('/environments', 200, `lista incompleta: ${encontrados.length} de ${dados.total_count} environments`);
  }
  const esperados = [...baseline.environments].sort();
  const prefixosVercel = (baseline.environments_vercel_managed?.prefixos ?? []);
  const daVercel = (nome) => prefixosVercel.some((p) => nome.startsWith(p));
  // Environment gerenciado pela Vercel pode sumir sozinho: ausencia dele nao e regressao
  // (mesma regra que ja vale para a presenca, abaixo).
  const faltando = esperados.filter((e) => !encontrados.includes(e) && !daVercel(e));
  // W13: environments extras — podem ser gerenciados pela Vercel ou inesperados.
  const extras = encontrados.filter((e) => !esperados.includes(e));
  const extrasVercel = extras.filter(daVercel);
  const extrasInesperados = extras.filter((e) => !extrasVercel.includes(e));

  const divergencias = [];
  if (faltando.length > 0) {
    divergencias.push({
      campo: 'environments.faltando',
      esperado: faltando.join(', '),
      encontrado: '(ausente)',
      restauravel: false,
    });
  }
  if (extrasVercel.length > 0) {
    // Aviso não bloqueante: Vercel cria/apaga automaticamente, não é regressão do perímetro.
    // Emite annotation do Actions e também avisa no stderr.
    console.error(`::warning::W13: environments gerenciados pela Vercel presentes (não é regressão): ${extrasVercel.join(', ')}`);
  }
  if (extrasInesperados.length > 0) {
    divergencias.push({
      campo: 'environments.extras_inesperados',
      esperado: '(nenhum além dos do baseline)',
      encontrado: extrasInesperados.join(', '),
      restauravel: false,
    });
  }
  return divergencias;
}

// ---------------------------------------------------------------- restauração

async function restaurar(campo) {
  // Loggi (achado por simulação nesta sessão): a versão original hardcodava `true`
  // aqui — coincide com o baseline do Zapp (strict=true), mas no Loggi o baseline
  // é strict=false (AGENTS.md: "PR atrasada da main mergeia mesmo assim"). Com o
  // valor fixo, uma divergência real (ex.: alguém liga strict ao vivo) seria
  // "restaurada" para `true` — fixando o próprio valor divergente, no sentido
  // contrário ao baseline. Lê do baseline, não do literal.
  if (campo === 'branch_protection_main.strict') {
    const protection = await gh('GET', `/repos/${OWNER}/${REPO_NAME}/branches/${BRANCH}/protection`);
    const contexts = protection?.required_status_checks?.contexts ?? [];
    const valorBaseline = baseline.branch_protection_main.strict;
    await gh('PATCH', `/repos/${OWNER}/${REPO_NAME}/branches/${BRANCH}/protection/required_status_checks`, {
      strict: valorBaseline,
      contexts,
    });
    return `\`branch_protection_main.strict\` restaurado para \`${valorBaseline}\``;
  }
  if (campo === 'merge.allow_auto_merge') {
    const valorBaseline = baseline.merge.allow_auto_merge;
    await gh('PATCH', `/repos/${OWNER}/${REPO_NAME}`, { allow_auto_merge: valorBaseline });
    return `\`merge.allow_auto_merge\` restaurado para \`${valorBaseline}\``;
  }
  return null;
}

// ---------------------------------------------------------------- issue

async function findIssue() {
  const issues = await gh('GET', `/repos/${OWNER}/${REPO_NAME}/issues?labels=${ISSUE_LABEL}&state=open&per_page=10`);
  return Array.isArray(issues) ? issues.find((i) => i.title === ISSUE_TITLE) ?? null : null;
}

/**
 * Assinatura estavel da causa: campos divergentes (com o valor lido) + checagens cegas
 * (nome + conjunto ordenado dos campos nao lidos, quando a cegueira e parcial — sem isso
 * "faltou allow_auto_merge" e "faltou allow_squash_merge" davam a mesma assinatura e a
 * mudanca de ponto cego ficava 7 dias suprimida; achado do Devin/Codex na PR #1920).
 * Nunca entra: prosa de erro, timestamp, numero de run.
 */
export function assinaturaDe(divergencias, naoVerificaveis) {
  const div = [...divergencias].map((d) => `${d.campo}=${String(d.encontrado)}`).sort(porCodigo);
  const cegos = [...naoVerificaveis]
    .map((n) => `${n.nome}:${[...(n.campos ?? [])].sort(porCodigo).join('|')}`)
    .sort(porCodigo);
  return createHash('sha256').update(JSON.stringify({ div, cegos })).digest('hex').slice(0, 16);
}

const MARCADOR = (assinatura) => `<!-- causa:${assinatura} -->`;
const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Registro MAIS RECENTE da issue que carrega o marcador desta causa (comentario ou o
 * proprio corpo), escrito PELO GUARD. Olha as 2 ultimas paginas (ate 200 comentarios): um
 * comentario humano ou de outro bot depois do marcador nao pode zerar o dedupe, e um
 * marcador colado por terceiros nao pode acioná-lo (achados do Codex na PR #1920).
 * Devolve null quando a causa nunca foi registrada.
 */
async function registroMaisRecenteCom(issue, marcador) {
  const total = Number(issue.comments ?? 0);
  if (total > 0) {
    const ultimaPagina = Math.max(1, Math.ceil(total / 100));
    for (const pagina of [ultimaPagina, ultimaPagina - 1]) {
      if (pagina < 1) continue;
      const comentarios = await gh('GET', `/repos/${OWNER}/${REPO_NAME}/issues/${issue.number}/comments?per_page=100&page=${pagina}`);
      if (!Array.isArray(comentarios)) continue;
      for (let i = comentarios.length - 1; i >= 0; i -= 1) {
        const c = comentarios[i];
        if (escritoPeloGuard(c) && (c.body ?? '').includes(marcador)) return { body: c.body, created_at: c.created_at };
      }
    }
  }
  if (escritoPeloGuard(issue) && (issue.body ?? '').includes(marcador)) return { body: issue.body, created_at: issue.created_at };
  return null;
}

/**
 * W05: dedupe por causa. Comenta de novo so se esta causa ainda nao foi registrada
 * na janela (6 h com divergencia real, 7 dias so com ponto cego) ou se houve
 * restauracao EFETIVA (que precisa ficar registrada sempre; tentativa que falhou
 * nao forca — senao um PATCH 403 recorrente comentaria a cada 6 h).
 */
async function abrirOuAtualizarIssue(body, { assinatura, janelaMs, forcar = false } = {}) {
  const existing = await findIssue();
  if (existing) {
    if (assinatura && !forcar) {
      const registro = await registroMaisRecenteCom(existing, MARCADOR(assinatura));
      const idadeMs = registro?.created_at ? Date.now() - new Date(registro.created_at).getTime() : Infinity;
      if (registro && idadeMs < janelaMs) {
        console.log(`Dedupe: mesma causa (${assinatura}) ha menos de ${Math.round(janelaMs / 3600000)} h; comentario suprimido (issue #${semQuebra(existing.number)}).`);
        return existing.number;
      }
    }
    await gh('POST', `/repos/${OWNER}/${REPO_NAME}/issues/${existing.number}/comments`, { body });
    console.log(`Issue #${semQuebra(existing.number)} atualizada com novo comentario.`);
    return existing.number;
  }
  await gh('POST', `/repos/${OWNER}/${REPO_NAME}/labels`, {
    name: ISSUE_LABEL,
    color: 'e11d48',
    description: 'Perimeter regression detected by settings-guard',
  }).catch(() => {});
  const issue = await gh('POST', `/repos/${OWNER}/${REPO_NAME}/issues`, {
    title: ISSUE_TITLE,
    body,
    labels: [ISSUE_LABEL],
  });
  console.log(`Issue #${semQuebra(issue.number)} aberta.`);
  return issue.number;

}

async function fecharIssue() {
  const existing = await findIssue();
  if (!existing) return;
  await gh('PATCH', `/repos/${OWNER}/${REPO_NAME}/issues/${existing.number}`, {
    state: 'closed',
    state_reason: 'completed',
  });
  await gh('POST', `/repos/${OWNER}/${REPO_NAME}/issues/${existing.number}/comments`, {
    body: '✅ Perimetro conferido contra o baseline — fechando automaticamente.',
  });
  console.log(`Issue #${existing.number} fechada.`);
}

// ---------------------------------------------------------------- principal

async function main() {
  if (!TOKEN) {
    console.error('::error::GITHUB_TOKEN ausente');
    process.exit(1);
  }
  if (!OWNER || !REPO_NAME || REPO.split('/').length !== 2) {
    console.error(`::error::GITHUB_REPOSITORY invalido ("${semQuebra(REPO)}"): esperado "dono/repo".`);
    process.exit(1);
  }
  const { erros: errosDoBaseline, avisos: chavesSemVigia } = baselineErro
    ? { erros: [`nao foi possivel ler o arquivo: ${baselineErro}`], avisos: [] }
    : problemasDoBaseline(baseline);
  if (errosDoBaseline.length > 0) {
    for (const erro of errosDoBaseline) console.error(`::error::Baseline invalido (${BASELINE_ARQUIVO}): ${semQuebra(erro)}`);
    process.exit(1);
  }
  if (chavesSemVigia.length > 0) {
    console.log(`::warning::Baseline (${BASELINE_ARQUIVO}) tem chave(s) que nenhuma checagem le: ${semQuebra(chavesSemVigia.join(', '))}. Confira a grafia.`);
  }
  if (dryRun) console.log('[dry-run] so leitura: nenhuma restauracao e nenhuma escrita em issue sera enviada.');
  console.log(`Leitura administrativa: ${fonteDaLeituraAdmin()}`);
  const checagens = [
    ['branch protection', checarBranchProtection],
    ['merge/repo', checarRepo],
    ['actions', checarActions],
    ['workflow permissions', checarWorkflowPermissions],
    ['selected actions', checarSelectedActions],
    ['rulesets', checarRulesets],
    ['environments', checarEnvironments],
  ];

  const divergencias = [];
  const naoVerificaveis = [];

  for (const [nome, fn] of checagens) {
    try {
      const resultado = await fn();
      const encontradas = Array.isArray(resultado) ? resultado : resultado.divergencias;
      if (!Array.isArray(resultado) && resultado.cego) {
        console.log(`::warning::${nome}: PARCIALMENTE VERIFICAVEL — ${semQuebra(resultado.cego)}`);
        naoVerificaveis.push({ nome: `${nome} (parcial)`, motivo: resultado.cego, campos: resultado.campos ?? [] });
      }
      console.log(`${nome}: ${encontradas.length === 0 ? 'OK' : `${encontradas.length} divergencia(s)`}`);
      divergencias.push(...encontradas);
    } catch (e) {
      if (e instanceof NaoVerificavel) {
        // Ponto cego declarado: não é regressão, mas precisa aparecer.
        console.log(`::warning::${nome}: NAO VERIFICAVEL — ${semQuebra(e.message)}`);
        naoVerificaveis.push({ nome, motivo: `${e.status} — ${e.message.split(': ').slice(1).join(': ')}`, campos: [String(e.status)] });
      } else {
        throw e;
      }
    }
  }

  for (const d of divergencias) {
    console.log(`divergencia: ${semQuebra(d.campo)} esperado=${semQuebra(d.esperado)} encontrado=${semQuebra(d.encontrado)}`);
  }

  // W17: salva snapshot do perimetro medido para artifact de diff.
  const snapshotPath = process.env.PERIMETER_SNAPSHOT_PATH;
  if (snapshotPath) {
    const snapshot = {
      medido_em: new Date().toISOString(),
      run_id: process.env.GITHUB_RUN_ID ?? 'manual',
      divergencias,
      nao_verificaveis: naoVerificaveis,
    };
    // O snapshot e so um artefato de apoio: falhar ao grava-lo nao pode esconder o resultado.
    try {
      writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
      console.log(`Snapshot do perimetro salvo em ${snapshotPath}`);
    } catch (e) {
      console.log(`::warning::Snapshot do perimetro nao foi salvo em ${semQuebra(snapshotPath)}: ${semQuebra(e.message)}`);
    }
  }

  if (divergencias.length === 0 && naoVerificaveis.length === 0) {
    console.log('✅ Perimetro OK — nenhuma regressao detectada.');
    await fecharIssue();
    return;
  }

  // Restaura só o que o guard sabe restaurar; o resto vira alerta. Sucesso e falha
  // ficam em listas separadas: so o sucesso forca comentario (Devin, PR #1920).
  const restaurados = [];
  const restauracoesEfetivas = [];
  for (const d of divergencias.filter((x) => x.restauravel)) {
    if (dryRun) {
      console.log(`[dry-run] restauraria ${semQuebra(d.campo)} para ${semQuebra(d.esperado)}.`);
      continue;
    }
    try {
      const feito = await restaurar(d.campo);
      if (feito) {
        restaurados.push(feito);
        restauracoesEfetivas.push(d.campo);
        console.log(`Restaurado: ${semQuebra(d.campo)}`);
      }
    } catch (e) {
      restaurados.push(`⚠️ falhou ao restaurar \`${d.campo}\`: ${e.message.split(':')[0]}`);
    }
  }

  const soCegos = divergencias.length === 0;
  const assinatura = assinaturaDe(divergencias, naoVerificaveis);
  const linhas = [
    MARCADOR(assinatura),
    soCegos ? '## 👁️ Ponto cego do perímetro (nada divergiu do que foi possível ler)' : '## ⚠️ Divergência de perímetro detectada',
    '',
    `Baseline: \`${BASELINE_ARQUIVO}\` (medido em ${baseline.medido_em})`,
    '',
  ];

  if (divergencias.length > 0) {
    linhas.push(
      '### Divergências',
      '',
      '| Campo | Esperado | Encontrado |',
      '|---|---|---|',
      ...divergencias.map(
        (d) =>
          `| \`${semQuebra(d.campo)}\` | \`${semQuebra(d.esperado)}\` | \`${semQuebra(d.encontrado)}\` |`,
      ),
      '',
    );
  }

  if (naoVerificaveis.length > 0) {
    linhas.push(
      '### Não verificável com o token do workflow',
      '',
      'Estes campos **não puderam ser conferidos** — a API exige escopo que o token usado não tem.',
      'Não é "está tudo certo": é "não consegui olhar".',
      '',
      `Leitura administrativa deste run: ${fonteDaLeituraAdmin()}. Credencial e rotação: \`${RUNBOOK_SEGREDOS}\`.`,
      '',
      '| Checagem | Motivo |',
      '|---|---|',
      ...naoVerificaveis.map((n) => `| ${n.nome} | ${semQuebra(n.motivo).replace(/\|/g, '/')} |`),
      '',
    );
  }

  if (restaurados.length > 0) {
    linhas.push('### Restaurações aplicadas', '', ...restaurados.map((r) => `- ${r}`), '');
  }

  linhas.push(
    `Run: https://github.com/${REPO}/actions/runs/${process.env.GITHUB_RUN_ID ?? 'manual'}`,
    `Timestamp: ${new Date().toISOString()}`,
  );

  if (dryRun) console.log(`[dry-run] corpo que iria para a issue:\n${linhas.join('\n')}`);
  await abrirOuAtualizarIssue(linhas.join('\n'), {
    assinatura,
    janelaMs: soCegos ? SETE_DIAS_MS : SEIS_HORAS_MS,
    forcar: restauracoesEfetivas.length > 0,
  });

  if (soCegos) {
    // W05: "nao consegui olhar" precisa de gente (a issue existe para isso), mas
    // NAO e regressao — um run vermelho a cada 6 h por falta de escopo ensina a
    // ignorar o vermelho. O job sai verde com aviso; a credencial de leitura
    // administrativa (W11/W12) e o que fecha o ponto cego de verdade.
    console.log(`::warning::Perimetro com ${naoVerificaveis.length} ponto(s) cego(s) e nenhuma divergencia lida. Ver issue [settings-guard].`);
    return;
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Uso: node scripts/ci/github-settings-guard.mjs [--dry-run]

Confere o perimetro do GitHub (branch protection da main, merge, Actions, rulesets,
environments) contra ${BASELINE_ARQUIVO}.
  --dry-run   so leitura: nao restaura nada e nao abre, comenta nem fecha issue.

Variaveis: GITHUB_TOKEN (obrigatoria), ADMIN_READ_TOKEN (PAT com administration:read),
GITHUB_REPOSITORY (dono/repo), PERIMETER_SNAPSHOT_PATH, SETTINGS_GUARD_AUTOR.
Exit: 0 = perimetro OK ou so ponto cego; 1 = divergencia ou erro.`);
    process.exit(0);
  }
  const desconhecidos = args.filter((a) => a !== '--dry-run');
  if (desconhecidos.length > 0) {
    console.error(`::error::Argumento desconhecido: ${semQuebra(desconhecidos.join(' '))}. Use --dry-run ou --help.`);
    process.exit(1);
  }
  dryRun = args.includes('--dry-run');
  main().catch((e) => {
    console.error('::error::' + e.message);
    process.exit(1);
  });
}

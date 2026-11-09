#!/usr/bin/env node
/**
 * Garante que as instrucoes para agentes nao foram apagadas ou esvaziadas por outra sessao.
 * Alvo: AGENTS.md (regras) + docs/agentes/*.md (referencia). CLAUDE.md e so `@AGENTS.md`.
 * Verifica: AGENTS.md existe, cabecalhos obrigatorios presentes, o conjunto
 * AGENTS.md + CLAUDE.md + docs/agentes/*.md nao encolheu >30% em bytes vs a base, e cada arquivo
 * vigiado (AGENTS.md e cada docs/agentes/*.md que exista na base) continua existindo com >=50% do
 * tamanho que tem na base (o limiar do conjunto sozinho nao pega o esvaziamento de 1 arquivo).
 * Base: CLAUDE_MD_BASE (no CI, a main buscada com git fetch; no checkout do CI o HEAD e o proprio arquivo
 * e a comparacao viraria no-op). Localmente, sem a variavel, compara com o HEAD.
 * Na base o conjunto e o que existir la (antes deste padrao, so AGENTS.md).
 * Tambem exige que o CLAUDE.md continue importando `@AGENTS.md` (sem isso o agente Claude nao le regra nenhuma).
 * Confere sempre o repositorio em que este arquivo esta, qualquer que seja o cwd.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../..', import.meta.url)));

const AGENTS = 'AGENTS.md';
const DOCS_DIR = 'docs/agentes';
const CONJUNTO_RAIZ = ['AGENTS.md', 'CLAUDE.md'];
const REQUIRED_SECTIONS = [
  '## Postura',
  '## Bugs e funcionalidades',
  '## Comunicação',
  '## Fluxo Git',
  '## Banco',
  '## Serviços',
  '## Stack e comandos',
  '## Grafo de código',
];
const SHRINK_THRESHOLD = 0.30;
const FILE_SHRINK_THRESHOLD = 0.50;

let content;
try {
  content = readFileSync(AGENTS, 'utf8');
} catch {
  console.error(`::error::${AGENTS} nao encontrado. Outra sessao pode ter apagado o arquivo.`);
  process.exitCode = 1;
  process.exit();
}

// Cabecalho = inicio de linha: citar `## Postura` numa frase ou rebaixar para `### Postura` nao conta.
const linhas = content.split(/\r?\n/);
const missing = REQUIRED_SECTIONS.filter((s) => !linhas.some((l) => l.startsWith(s)));
if (missing.length > 0) {
  for (const s of missing) console.error(`::error::${AGENTS}: secao obrigatoria ausente: ${s}`);
  process.exitCode = 1;
  process.exit();
}

const claude = existsSync('CLAUDE.md') ? readFileSync('CLAUDE.md', 'utf8') : '';
if (!/(^|\s)@(\.\/)?AGENTS\.md(\s|$)/.test(claude)) {
  console.error(`::error::CLAUDE.md ausente ou sem a linha @${AGENTS}: os agentes Claude deixam de carregar as regras. Restaure o arquivo com o conteudo "@${AGENTS}".`);
  process.exitCode = 1;
  process.exit();
}

// Todo .md sob docs/agentes, subpastas inclusas — o mesmo conjunto que `git ls-tree -r` devolve na base.
function mdsAtuais(dir = DOCS_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = `${dir}/${e.name}`;
    if (e.isDirectory()) return mdsAtuais(caminho);
    return e.isFile() && e.name.endsWith('.md') ? [caminho] : [];
  });
}

function bytesAtuais() {
  let total = 0;
  for (const f of CONJUNTO_RAIZ) {
    if (existsSync(f)) total += Buffer.byteLength(readFileSync(f, 'utf8'));
  }
  for (const f of mdsAtuais()) total += Buffer.byteLength(readFileSync(f, 'utf8'));
  return total;
}

// Tamanho na base de cada arquivo do conjunto: { total, porArquivo: Map(path -> bytes) } ou null
// quando a base nao tem nenhum deles (ref inexistente, checkout raso sem a main).
// execFileSync + `-z`: nome com espaco, acento ou aspas chega inteiro ao git, e nada da base passa por shell.
function bytesNaBase(base) {
  const porArquivo = new Map();
  const tamanho = (path) => {
    try {
      const out = execFileSync('git', ['cat-file', '-s', `${base}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      porArquivo.set(path, Number.parseInt(out.trim(), 10) || 0);
    } catch {
      /* nao existe na base */
    }
  };
  for (const f of CONJUNTO_RAIZ) tamanho(f);
  let lista = '';
  try {
    lista = execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', base, '--', DOCS_DIR], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    lista = '';
  }
  for (const path of lista.split('\0').filter((l) => l.endsWith('.md'))) tamanho(path);
  if (porArquivo.size === 0) return null;
  let total = 0;
  for (const n of porArquivo.values()) total += n;
  return { total, porArquivo };
}

const BASE = process.env.CLAUDE_MD_BASE || 'HEAD';
const baseIsExplicit = process.env.CLAUDE_MD_BASE !== undefined && process.env.CLAUDE_MD_BASE !== 'HEAD';
const atual = bytesAtuais();
const base = bytesNaBase(BASE);

if (!base && baseIsExplicit) {
  console.error(`::error::CLAUDE_MD_BASE="${BASE}" nao retornou nenhum arquivo do conjunto — ref invalida ou checkout raso demais. Comparacao de tamanho ignorada mas isso indica configuracao incorreta do CI.`);
  process.exitCode = 1;
  process.exit();
}

if (base) {
  const ratio = atual / base.total;
  if (ratio < (1 - SHRINK_THRESHOLD)) {
    console.error(`::error::Instrucoes para agentes (AGENTS.md + CLAUDE.md + ${DOCS_DIR}/*.md) encolheram ${Math.round((1 - ratio) * 100)}% vs ${BASE} (atual: ${atual} bytes, base: ${base.total} bytes). Possivel wipe por sessao paralela.`);
    process.exitCode = 1;
    process.exit();
  }
  // Por arquivo: AGENTS.md e cada docs/agentes/*.md que exista na base precisa continuar existindo
  // com >= 50% do tamanho de la. CLAUDE.md fica de fora: e so `@AGENTS.md` por design.
  let falhas = 0;
  for (const [path, naBase] of base.porArquivo) {
    if (path === 'CLAUDE.md' || naBase === 0) continue;
    if (!existsSync(path)) {
      console.error(`::error::${path} existia em ${BASE} (${naBase} bytes) e sumiu. Possivel wipe por sessao paralela.`);
      falhas += 1;
      continue;
    }
    const agora = Buffer.byteLength(readFileSync(path, 'utf8'));
    if (agora < naBase * FILE_SHRINK_THRESHOLD) {
      console.error(`::error::${path} encolheu ${Math.round((1 - agora / naBase) * 100)}% vs ${BASE} (atual: ${agora} bytes, base: ${naBase} bytes); limite por arquivo e ${Math.round(FILE_SHRINK_THRESHOLD * 100)}%.`);
      falhas += 1;
    }
  }
  if (falhas > 0) {
    process.exitCode = 1;
    process.exit();
  }
}

console.log(`${AGENTS} OK: ${REQUIRED_SECTIONS.length} secoes presentes; conjunto com ${DOCS_DIR}/: ${atual} bytes${base ? ` (base ${BASE}: ${base.total} bytes em ${base.porArquivo.size} arquivos, cada um >= ${Math.round(FILE_SHRINK_THRESHOLD * 100)}% do tamanho na base)` : ''}.`);

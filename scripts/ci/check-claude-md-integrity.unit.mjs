// Teste do guard das instrucoes para agentes (scripts/ci/check-claude-md-integrity.mjs).
// Cada caso monta um repositorio git sintetico em pasta temporaria, copia o guard para
// scripts/ci/ desse repositorio e o executa como o CI executa (subprocesso, exit code + stderr).
// Offline, sem credencial; nada e escrito neste repositorio.
// Rodar: node --test scripts/ci/check-claude-md-integrity.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GUARD = fileURLToPath(new URL('./check-claude-md-integrity.mjs', import.meta.url));
const SECOES = [
  '## Postura',
  '## Bugs e funcionalidades',
  '## Comunicação',
  '## Fluxo Git',
  '## Banco',
  '## Serviços',
  '## Stack e comandos',
  '## Grafo de código',
];
const GIT_ENV = {
  PATH: process.env.PATH,
  HOME: os.tmpdir(),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'teste',
  GIT_AUTHOR_EMAIL: 'teste@example.invalid',
  GIT_COMMITTER_NAME: 'teste',
  GIT_COMMITTER_EMAIL: 'teste@example.invalid',
};

const temporarios = [];
after(() => {
  for (const dir of temporarios) fs.rmSync(dir, { recursive: true, force: true });
});

function git(cwd, ...args) {
  const r = spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'protocol.file.allow=always', ...args], {
    cwd,
    env: GIT_ENV,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `git ${args.join(' ')} falhou: ${r.stderr}`);
  return r.stdout;
}

const escrever = (root, rel, texto) => {
  const destino = path.join(root, rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, texto);
};

const agentsMd = (secoes = SECOES, recheio = 400) =>
  `# AGENTS.md\n\n${secoes.map((s) => `${s}\n${'regra do dono. '.repeat(Math.ceil(recheio / 15))}\n`).join('\n')}`;

/** Repositorio com AGENTS.md (8 secoes), CLAUDE.md e dois docs/agentes, commitado na `main`. */
function repositorio({ semGit = false, extras = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-agentes-'));
  temporarios.push(root);
  escrever(root, 'AGENTS.md', agentsMd());
  escrever(root, 'CLAUDE.md', '@AGENTS.md\n');
  escrever(root, 'docs/agentes/banco.md', `# Banco\n${'detalhe do banco. '.repeat(120)}\n`);
  escrever(root, 'docs/agentes/deploy.md', `# Deploy\n${'detalhe do deploy. '.repeat(120)}\n`);
  for (const [rel, texto] of Object.entries(extras)) escrever(root, rel, texto);
  fs.mkdirSync(path.join(root, 'scripts/ci'), { recursive: true });
  fs.copyFileSync(GUARD, path.join(root, 'scripts/ci/check-claude-md-integrity.mjs'));
  if (!semGit) {
    git(root, 'init', '-q', '-b', 'main');
    git(root, 'add', '-A');
    git(root, 'commit', '-q', '-m', 'base');
  }
  return root;
}

function rodar(root, { env = {}, cwd = root } = {}) {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts/ci/check-claude-md-integrity.mjs')], {
    cwd,
    env: { ...GIT_ENV, ...env },
    encoding: 'utf8',
  });
  return { status: r.status, out: r.stdout, err: r.stderr, tudo: `${r.stdout}${r.stderr}` };
}

const tamanho = (root, rel) => fs.statSync(path.join(root, rel)).size;

// ------------------------------------------------------------------ caminho feliz

test('repositorio intacto passa e informa a base usada', () => {
  const root = repositorio();
  const r = rodar(root);
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /AGENTS\.md OK: 8 secoes presentes/);
  assert.match(r.out, /base HEAD: \d+ bytes em 4 arquivos/);
});

test('execucao repetida da o mesmo resultado e nao suja o repositorio', () => {
  const root = repositorio();
  const a = rodar(root);
  const b = rodar(root);
  assert.equal(a.status, 0);
  assert.equal(a.out, b.out);
  assert.equal(git(root, 'status', '--porcelain'), '');
});

test('AGENTS.md com CRLF continua com as 8 secoes reconhecidas', () => {
  const root = repositorio();
  escrever(root, 'AGENTS.md', agentsMd().replace(/\n/g, '\r\n'));
  assert.equal(rodar(root).status, 0);
});

test('o AGENTS.md real deste repositorio tem as 8 secoes como cabecalho de linha', () => {
  const real = fs.readFileSync(new URL('../../AGENTS.md', import.meta.url), 'utf8').split(/\r?\n/);
  for (const secao of SECOES) assert.ok(real.some((l) => l.startsWith(secao)), `faltou ${secao}`);
});

test('rodar de um subdiretorio confere o mesmo repositorio (nao depende do cwd)', () => {
  const root = repositorio();
  const r = rodar(root, { cwd: path.join(root, 'docs/agentes') });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /base HEAD: \d+ bytes em 4 arquivos/);
});

// ------------------------------------------------------------------ AGENTS.md e secoes

test('AGENTS.md ausente falha', () => {
  const root = repositorio();
  fs.rmSync(path.join(root, 'AGENTS.md'));
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /::error::AGENTS\.md nao encontrado/);
});

for (const secao of SECOES) {
  test(`secao removida falha e e nomeada: ${secao}`, () => {
    const root = repositorio();
    escrever(root, 'AGENTS.md', agentsMd(SECOES.filter((s) => s !== secao), 460));
    const r = rodar(root);
    assert.equal(r.status, 1);
    assert.ok(r.err.includes(`secao obrigatoria ausente: ${secao}`), r.err);
  });
}

test('duas secoes removidas: as duas sao listadas', () => {
  const root = repositorio();
  escrever(root, 'AGENTS.md', agentsMd(SECOES.slice(2), 540));
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /ausente: ## Postura/);
  assert.match(r.err, /ausente: ## Bugs e funcionalidades/);
});

test('secao so citada no meio de uma frase nao conta como cabecalho', () => {
  const root = repositorio();
  const semPostura = agentsMd(SECOES.filter((s) => s !== '## Postura'), 460);
  escrever(root, 'AGENTS.md', `${semPostura}\nA antiga secao \`## Postura\` foi resumida aqui.\n`);
  const r = rodar(root);
  assert.equal(r.status, 1, 'citacao inline nao pode satisfazer o guard');
  assert.match(r.err, /ausente: ## Postura/);
});

test('secao rebaixada para ### nao conta como cabecalho', () => {
  const root = repositorio();
  escrever(root, 'AGENTS.md', agentsMd().replace('## Banco\n', '### Banco\n'));
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /ausente: ## Banco/);
});

test('cabecalho com sufixo (## Banco — ler ...) continua valendo', () => {
  const root = repositorio();
  escrever(root, 'AGENTS.md', agentsMd().replace('## Banco\n', '## Banco — ler `docs/agentes/banco.md`\n'));
  assert.equal(rodar(root).status, 0);
});

// ------------------------------------------------------------------ CLAUDE.md

test('CLAUDE.md que nao importa AGENTS.md falha', () => {
  const root = repositorio();
  escrever(root, 'CLAUDE.md', '# Regras\nUse o bom senso.\n');
  const r = rodar(root);
  assert.equal(r.status, 1, r.tudo);
  assert.match(r.err, /::error::CLAUDE\.md/);
  assert.match(r.err, /@AGENTS\.md/);
});

test('CLAUDE.md ausente falha', () => {
  const root = repositorio();
  fs.rmSync(path.join(root, 'CLAUDE.md'));
  const r = rodar(root);
  assert.equal(r.status, 1, r.tudo);
  assert.match(r.err, /::error::CLAUDE\.md/);
});

test('CLAUDE.md vazio falha', () => {
  const root = repositorio();
  escrever(root, 'CLAUDE.md', '');
  assert.equal(rodar(root).status, 1);
});

test('CLAUDE.md que cita AGENTS.md sem o @ de importacao falha', () => {
  const root = repositorio();
  escrever(root, 'CLAUDE.md', 'Leia AGENTS.md antes de comecar.\n');
  assert.equal(rodar(root).status, 1);
});

test('CLAUDE.md com @AGENTS.md e texto extra passa', () => {
  const root = repositorio();
  escrever(root, 'CLAUDE.md', '# Claude\r\n\r\n  @AGENTS.md  \r\n\r\nNota local.\r\n');
  assert.equal(rodar(root).status, 0);
});

// ------------------------------------------------------------------ encolhimento

test('conjunto encolhe mais de 30%: falha com os bytes', () => {
  const root = repositorio();
  for (const rel of ['AGENTS.md', 'docs/agentes/banco.md', 'docs/agentes/deploy.md']) {
    const texto = fs.readFileSync(path.join(root, rel), 'utf8');
    escrever(root, rel, texto.slice(0, Math.floor(texto.length * 0.6)) + (rel === 'AGENTS.md' ? `\n${SECOES.join('\n')}\n` : ''));
  }
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /encolheram \d+% vs HEAD \(atual: \d+ bytes, base: \d+ bytes\)/);
});

test('um arquivo so encolhe mais de 50% com o conjunto abaixo de 30%: falha nomeando o arquivo', () => {
  const root = repositorio({ extras: { 'docs/agentes/pequeno.md': 'x'.repeat(600) } });
  escrever(root, 'docs/agentes/pequeno.md', 'x'.repeat(100));
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /docs\/agentes\/pequeno\.md encolheu 83% vs HEAD/);
  assert.doesNotMatch(r.err, /encolheram/);
});

test('limite por arquivo: exatamente 50% passa, 1 byte abaixo falha', () => {
  const root = repositorio({ extras: { 'docs/agentes/pequeno.md': 'x'.repeat(600) } });
  escrever(root, 'docs/agentes/pequeno.md', 'x'.repeat(300));
  assert.equal(rodar(root).status, 0);
  escrever(root, 'docs/agentes/pequeno.md', 'x'.repeat(299));
  assert.equal(rodar(root).status, 1);
});

test('AGENTS.md reduzido so aos 8 cabecalhos falha pelo limite por arquivo', () => {
  const root = repositorio({ extras: { 'docs/agentes/grande.md': 'y'.repeat(60000) } });
  escrever(root, 'AGENTS.md', `${SECOES.join('\n')}\n`);
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /AGENTS\.md encolheu \d+% vs HEAD/);
});

test('arquivo de docs/agentes apagado falha com "sumiu"', () => {
  const root = repositorio({ extras: { 'docs/agentes/pequeno.md': 'x'.repeat(600) } });
  fs.rmSync(path.join(root, 'docs/agentes/pequeno.md'));
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /docs\/agentes\/pequeno\.md existia em HEAD \(600 bytes\) e sumiu/);
});

test('dois arquivos esvaziados: os dois aparecem no erro', () => {
  const root = repositorio({ extras: { 'docs/agentes/grande.md': 'y'.repeat(60000) } });
  escrever(root, 'docs/agentes/banco.md', 'x');
  escrever(root, 'docs/agentes/deploy.md', 'x');
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /banco\.md encolheu/);
  assert.match(r.err, /deploy\.md encolheu/);
});

test('arquivo novo em docs/agentes passa e entra no total atual', () => {
  const root = repositorio();
  const antes = Number(/com docs\/agentes\/: (\d+) bytes/.exec(rodar(root).out)[1]);
  escrever(root, 'docs/agentes/novo.md', 'n'.repeat(1000));
  const r = rodar(root);
  assert.equal(r.status, 0, r.tudo);
  assert.equal(Number(/com docs\/agentes\/: (\d+) bytes/.exec(r.out)[1]), antes + 1000);
});

test('arquivo novo nao mascara o esvaziamento de outro', () => {
  const root = repositorio();
  escrever(root, 'docs/agentes/banco.md', 'x');
  escrever(root, 'docs/agentes/novo.md', 'n'.repeat(5000));
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /banco\.md encolheu/);
});

test('mover conteudo do AGENTS.md para docs/agentes (ate 50%) passa', () => {
  const root = repositorio();
  const texto = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  const movido = 'regra do dono. '.repeat(20);
  escrever(root, 'AGENTS.md', texto.replace(movido, ''));
  escrever(root, 'docs/agentes/postura.md', movido);
  assert.ok(tamanho(root, 'AGENTS.md') < texto.length);
  assert.equal(rodar(root).status, 0);
});

test('arquivo que nao e .md em docs/agentes e ignorado nos dois lados', () => {
  const root = repositorio({ extras: { 'docs/agentes/diagrama.png': 'p'.repeat(90000) } });
  fs.rmSync(path.join(root, 'docs/agentes/diagrama.png'));
  assert.equal(rodar(root).status, 0);
});

test('arquivo vazio na base nao gera divisao por zero nem falha', () => {
  const root = repositorio({ extras: { 'docs/agentes/vazio.md': '' } });
  assert.equal(rodar(root).status, 0);
});

// ------------------------------------------------------------------ nomes dificeis e subpastas

test('arquivo com acento e espaco no nome e vigiado: esvaziar falha', () => {
  const root = repositorio({ extras: { 'docs/agentes/integrações externas.md': 'z'.repeat(800) } });
  assert.equal(rodar(root).status, 0, 'intacto tem de passar');
  assert.match(rodar(root).out, /em 5 arquivos/, 'o arquivo com acento tem de entrar na base');
  escrever(root, 'docs/agentes/integrações externas.md', 'z');
  const r = rodar(root);
  assert.equal(r.status, 1, 'esvaziar arquivo com acento/espaco tem de falhar');
  assert.match(r.err, /integrações externas\.md encolheu/);
});

test('arquivo com aspas e cifrao no nome nao quebra o guard', () => {
  const nome = 'docs/agentes/it\'s "$HOME" `x`.md';
  const root = repositorio({ extras: { [nome]: 'q'.repeat(800) } });
  assert.match(rodar(root).out, /em 5 arquivos/);
  fs.rmSync(path.join(root, nome));
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /sumiu/);
});

test('subpasta de docs/agentes conta igual na base e no atual (sem falso encolhimento)', () => {
  const root = repositorio({ extras: { 'docs/agentes/sub/grande.md': 'g'.repeat(40000) } });
  const r = rodar(root);
  assert.equal(r.status, 0, r.tudo);
  const m = /conjunto com docs\/agentes\/: (\d+) bytes \(base HEAD: (\d+) bytes/.exec(r.out);
  assert.equal(m[1], m[2], 'sem mudanca, atual e base tem de bater');
});

test('arquivo em subpasta esvaziado falha', () => {
  const root = repositorio({ extras: { 'docs/agentes/sub/grande.md': 'g'.repeat(1500) } });
  escrever(root, 'docs/agentes/sub/grande.md', 'g');
  const r = rodar(root);
  assert.equal(r.status, 1);
  assert.match(r.err, /sub\/grande\.md encolheu/);
});

test('diretorio chamado algo.md nao derruba o guard', () => {
  const root = repositorio();
  fs.mkdirSync(path.join(root, 'docs/agentes/pasta.md'));
  const r = rodar(root);
  assert.equal(r.status, 0, r.tudo);
});

// ------------------------------------------------------------------ base (git)

test('CLAUDE_MD_BASE com ref inexistente falha fechado', () => {
  const root = repositorio();
  const r = rodar(root, { env: { CLAUDE_MD_BASE: 'origin/nao-existe' } });
  assert.equal(r.status, 1);
  assert.match(r.err, /CLAUDE_MD_BASE="origin\/nao-existe" nao retornou nenhum arquivo/);
});

test('CLAUDE_MD_BASE vazio equivale a HEAD', () => {
  const root = repositorio();
  const r = rodar(root, { env: { CLAUDE_MD_BASE: '' } });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /base HEAD:/);
});

test('CLAUDE_MD_BASE nao e interpretado pelo shell', () => {
  const root = repositorio();
  const r = rodar(root, { env: { CLAUDE_MD_BASE: 'HEAD; touch INJETADO; echo ' } });
  assert.equal(r.status, 1);
  assert.deepEqual(fs.readdirSync(root).filter((f) => f.includes('INJETADO')), []);
});

test('sem repositorio git e sem base explicita: passa so com as checagens de conteudo', () => {
  const root = repositorio({ semGit: true });
  const r = rodar(root);
  assert.equal(r.status, 0, r.tudo);
  assert.doesNotMatch(r.out, /base HEAD/);
});

test('sem repositorio git e com base explicita: falha fechado', () => {
  const root = repositorio({ semGit: true });
  assert.equal(rodar(root, { env: { CLAUDE_MD_BASE: 'FETCH_HEAD' } }).status, 1);
});

test('como no CI: clone raso + git fetch --depth=1 origin main + CLAUDE_MD_BASE=FETCH_HEAD', () => {
  const origem = repositorio();
  const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-agentes-clone-'));
  temporarios.push(clone);
  git(os.tmpdir(), 'clone', '-q', '--depth=1', `file://${origem}`, clone);
  git(clone, 'fetch', '-q', '--no-tags', '--depth=1', 'origin', 'main');

  const intacto = rodar(clone, { env: { CLAUDE_MD_BASE: 'FETCH_HEAD' } });
  assert.equal(intacto.status, 0, intacto.tudo);
  assert.match(intacto.out, /base FETCH_HEAD: \d+ bytes em 4 arquivos/);

  // A PR esvazia um arquivo E commita: comparar com o HEAD seria no-op, com a main pega.
  escrever(clone, 'docs/agentes/banco.md', 'x');
  git(clone, 'commit', '-q', '-am', 'wipe');
  assert.equal(rodar(clone).status, 0, 'contra o proprio HEAD nao ha o que comparar');
  const r = rodar(clone, { env: { CLAUDE_MD_BASE: 'FETCH_HEAD' } });
  assert.equal(r.status, 1);
  assert.match(r.err, /banco\.md encolheu \d+% vs FETCH_HEAD/);
});

test('clone raso sem o fetch da main: FETCH_HEAD nao existe e o guard falha fechado', () => {
  const origem = repositorio();
  const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-agentes-clone-'));
  temporarios.push(clone);
  git(os.tmpdir(), 'clone', '-q', '--depth=1', `file://${origem}`, clone);
  fs.rmSync(path.join(clone, '.git/FETCH_HEAD'), { force: true });
  const r = rodar(clone, { env: { CLAUDE_MD_BASE: 'FETCH_HEAD' } });
  assert.equal(r.status, 1);
  assert.match(r.err, /ref invalida ou checkout raso demais/);
});

test('base em que so existia o AGENTS.md (antes do padrao docs/agentes) passa', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-agentes-'));
  temporarios.push(root);
  escrever(root, 'AGENTS.md', agentsMd());
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'base antiga');
  escrever(root, 'CLAUDE.md', '@AGENTS.md\n');
  escrever(root, 'docs/agentes/banco.md', 'b'.repeat(500));
  fs.mkdirSync(path.join(root, 'scripts/ci'), { recursive: true });
  fs.copyFileSync(GUARD, path.join(root, 'scripts/ci/check-claude-md-integrity.mjs'));
  const r = rodar(root);
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /em 1 arquivos/);
});

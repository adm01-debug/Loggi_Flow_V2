// Testes de scripts/validate-no-console.mjs (nenhum console.* cru em edge function — evita PII em log).
// Rodar: node --test scripts/gates/validate-no-console.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { RAIZ_REPO, fixture, escreve, roda, limpa } from './helpers.mjs';

const SCRIPT = 'validate-no-console.mjs';
const FUNCS = 'supabase/functions';
const abertos = [];
after(() => abertos.forEach(limpa));

// Monta supabase/functions com os arquivos dados e roda o gate.
function gate(arquivos, opts) {
  const root = fixture(SCRIPT);
  abertos.push(root);
  for (const [rel, texto] of Object.entries(arquivos)) escreve(root, path.join(FUNCS, rel), texto);
  return { root, ...roda(root, SCRIPT, opts) };
}

const LIMPO = "import { log } from '../_shared/logger.ts';\nlog.info('ok');\n";

test('passa em árvore limpa e diz quantos arquivos leu', () => {
  const r = gate({ 'a/index.ts': LIMPO, 'b/index.ts': LIMPO, '_shared/cors.ts': 'export const x = 1;\n' });
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stdout, /No raw console\.\* calls in supabase\/functions \(3 /);
});

const pega = (nome, rel, texto, linha) => test(`pega: ${nome}`, () => {
  const r = gate({ 'ok/index.ts': LIMPO, [rel]: texto });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /Raw console\.\* calls detected/);
  assert.ok(r.stderr.includes(`${FUNCS}/${rel}:${linha}:`), r.stderr);
});
const ignora = (nome, rel, texto) => test(`ignora: ${nome}`, () => {
  const r = gate({ 'ok/index.ts': LIMPO, [rel]: texto });
  assert.equal(r.status, 0, r.saida);
});

for (const metodo of ['log', 'info', 'warn', 'error', 'debug', 'trace', 'table', 'dir', 'group', 'assert', 'time']) {
  pega(`console.${metodo}`, 'a/index.ts', `const a = 1;\nconsole.${metodo}(a);\n`, 2);
}
pega('em _shared/ (fora logger.ts e redis.ts)', '_shared/util.ts', "console.error('x');\n", 1);
pega('logger.ts que não é o de _shared', 'a/_shared/logger.ts', "console.log('x');\n", 1);
pega('com // eslint-disable-next-line no-console', 'a/index.ts', "// eslint-disable-next-line no-console\nconsole.log('x');\n", 2);
pega("acesso por colchete: console['log']", 'a/index.ts', "console['log']('x');\n", 1);
pega('optional chaining: console?.log', 'a/index.ts', "console?.log('x');\n", 1);
pega('espaço antes do ponto', 'a/index.ts', "console .log('x');\n", 1);
pega('chamada quebrada em duas linhas', 'a/index.ts', "const a = 1;\nconsole\n  .log(a);\n", 2);
pega('globalThis.console.log', 'a/index.ts', "globalThis.console.log('x');\n", 1);
pega('desestruturação: const { log } = console', 'a/index.ts', "const { log } = console;\nlog('pii');\n", 1);
pega('alias: const c = console', 'a/index.ts', "const c = console\nc.log('pii');\n", 1);
pega('console passado como argumento', 'a/index.ts', 'criaLogger(console);\n', 1);
pega('CRLF', 'a/index.ts', "const a = 1;\r\nconsole.log(a);\r\n", 2);
pega('subpasta funda', 'a/b/c/d.ts', "console.info('x');\n", 1);
pega('pasta com espaço e acento', 'função nova/index.ts', "console.debug('x');\n", 1);
pega('teste Deno *_test.ts (só *.test.ts é isento)', 'a/index_test.ts', "console.log('x');\n", 1);
pega('arquivo .tsx', 'a/email.tsx', "console.log('x');\n", 1);
pega('arquivo .js', 'a/helper.js', "console.log('x');\n", 1);
pega('arquivo .mjs', 'a/helper.mjs', "console.log('x');\n", 1);
// O gate é textual de propósito: comentário e string também contam (falha fechada).
pega('dentro de comentário de linha', 'a/index.ts', "// console.log('x')\n", 1);
pega('dentro de string', 'a/index.ts', "const dica = 'use console.log aqui';\n", 1);

ignora('_shared/logger.ts', '_shared/logger.ts', "console.log('x');\n");
ignora('_shared/redis.ts', '_shared/redis.ts', "console.warn('x');\n");
ignora('*.test.ts', 'a/index.test.ts', "console.log('x');\n");
ignora('outro identificador terminado em console', 'a/index.ts', "meuconsole.log('x');\n");
ignora('typeof console', 'a/index.ts', "const tem = typeof console !== 'undefined';\n");
ignora('a palavra console em prosa', 'a/index.ts', '// veja o erro no console do Supabase\n');
ignora('arquivo que não é código', 'a/deno.json', '{"x":"console.log"}\n');

test('lista todas as ocorrências, uma por linha, em ordem estável', () => {
  const r = gate({ 'b/index.ts': "console.log(1);\nconsole.log(2); console.warn(3);\n", 'a/index.ts': "console.error('x');\n" });
  assert.equal(r.status, 1);
  const hits = r.stderr.split('\n').filter((l) => l.startsWith(FUNCS));
  assert.deepEqual(hits.map((l) => l.split(':').slice(0, 2).join(':')), [`${FUNCS}/a/index.ts:1`, `${FUNCS}/b/index.ts:1`, `${FUNCS}/b/index.ts:2`]);
});

test('segue symlink de arquivo', () => {
  const r0 = gate({ 'ok/index.ts': LIMPO });
  escreve(r0.root, 'fora/impl.ts', "console.log('x');\n");
  fs.symlinkSync(path.join(r0.root, 'fora/impl.ts'), path.join(r0.root, FUNCS, 'ok/impl.ts'));
  const r = roda(r0.root, SCRIPT);
  assert.equal(r.status, 1, r.saida);
  assert.ok(r.stderr.includes(`${FUNCS}/ok/impl.ts:1:`), r.stderr);
});

test('falha: supabase/functions ausente — mensagem clara, sem stack trace', () => {
  const root = fixture(SCRIPT);
  abertos.push(root);
  const r = roda(root, SCRIPT);
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /supabase\/functions/);
  assert.doesNotMatch(r.stderr, /\n\s+at /);
});

test('falha: supabase/functions sem nenhum arquivo de código (gate não validou nada)', () => {
  const r = gate({ 'import_map.json': '{}\n' });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /supabase\/functions/);
});

test('independe do cwd', () => {
  const r0 = gate({ 'a/index.ts': "console.log('x');\n" });
  const r = roda(r0.root, SCRIPT, { cwd: path.join(r0.root, 'bin') });
  assert.equal(r.status, 1, r.saida);
  assert.ok(r.stderr.includes(`${FUNCS}/a/index.ts:1:`), r.stderr);
});

test('repo real: passa e cobre todas as edge functions', () => {
  const r = spawnSync(process.execPath, [path.join(RAIZ_REPO, 'scripts', SCRIPT)], { cwd: RAIZ_REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const lidos = Number(/\((\d+) /.exec(r.stdout)?.[1]);
  const funcs = fs.readdirSync(path.join(RAIZ_REPO, FUNCS), { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== '_shared');
  for (const f of funcs) assert.ok(fs.existsSync(path.join(RAIZ_REPO, FUNCS, f.name, 'index.ts')), `${f.name} sem index.ts`);
  assert.ok(lidos >= funcs.length, `leu ${lidos} arquivos para ${funcs.length} functions`);
});

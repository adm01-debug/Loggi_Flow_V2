// Teste do ratchet de typecheck (scripts/ci/typecheck-ratchet.mjs).
// Funcoes puras sao importadas direto; a CLI roda como subprocesso em pasta temporaria, com saidas
// de tsc gravadas em arquivo (--output) ou com um tsc falso em node_modules/typescript/bin/tsc.
// Offline, sem dependencias instaladas, sem rodar o tsc de verdade.
// Rodar: node --test scripts/ci/typecheck-ratchet.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertUsableCompilerResult, compareBaseline, createBaseline } from './typecheck-ratchet.mjs';

const RATCHET = fileURLToPath(new URL('./typecheck-ratchet.mjs', import.meta.url));
const REPO = fileURLToPath(new URL('../..', import.meta.url));

const temporarios = [];
after(() => {
  for (const dir of temporarios) fs.rmSync(dir, { recursive: true, force: true });
});

function pasta() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-ts-'));
  temporarios.push(root);
  return root;
}

const escrever = (root, rel, texto) => {
  const destino = path.join(root, rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, texto);
  return destino;
};

/** Roda a CLI com --root na pasta temporaria; `saida` vira o arquivo passado em --output. */
function cli(root, { saida, args = [], env = {}, cwd = root } = {}) {
  const argv = [RATCHET, '--root', root, ...args];
  if (saida !== undefined) argv.push('--output', escrever(root, 'tsc.txt', saida));
  const r = spawnSync(process.execPath, argv, { cwd, env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
  return { status: r.status, out: r.stdout, err: r.stderr, tudo: `${r.stdout}${r.stderr}` };
}

const baselineVazio = (root) =>
  escrever(root, 'scripts/ci/typecheck-baseline.json', `${JSON.stringify({ schemaVersion: 2, command: 'tsc -b --force', issues: [] }, null, 2)}\n`);

const gravarBaseline = (root, saidaTsc) =>
  escrever(root, 'scripts/ci/typecheck-baseline.json', `${JSON.stringify(createBaseline(saidaTsc, root), null, 2)}\n`);

/** tsc falso: grava tsconfig.tsbuildinfo (como o `tsc -b` real) e devolve o que o ambiente mandar. */
function tscFalso(root) {
  escrever(
    root,
    'node_modules/typescript/bin/tsc',
    `const fs = require('node:fs');
fs.writeFileSync('args-do-tsc.json', JSON.stringify(process.argv.slice(2)));
if (process.env.FAKE_TSC_BUILDINFO !== '0') fs.writeFileSync('tsconfig.tsbuildinfo', '{"falso":true}');
process.stdout.write(process.env.FAKE_TSC_STDOUT ?? '');
process.stderr.write(process.env.FAKE_TSC_STDERR ?? '');
if (process.env.FAKE_TSC_SINAL) process.kill(process.pid, process.env.FAKE_TSC_SINAL);
process.exit(Number(process.env.FAKE_TSC_EXIT ?? 0));
`,
  );
}

const E1 = "src/a.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.";
const E2 = "src/b.tsx(10,1): error TS2304: Cannot find name 'foo'.";
const E3 = "src/c.ts(1,1): error TS7006: Parameter 'x' implicitly has an 'any' type.";

// ------------------------------------------------------------------ o baseline versionado

test('baseline versionado e valido e nao passa do orcamento tsErrors do .warning-budget.json', () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/ci/typecheck-baseline.json'), 'utf8'));
  const orcamento = JSON.parse(fs.readFileSync(path.join(REPO, '.warning-budget.json'), 'utf8'));
  assert.equal(baseline.schemaVersion, 2);
  assert.equal(baseline.command, 'tsc -b --force');
  assert.ok(Array.isArray(baseline.issues));
  assert.ok(
    baseline.issues.length <= orcamento.tsErrors,
    `baseline tolera ${baseline.issues.length} erro(s) de tipo; o orcamento do dono e ${orcamento.tsErrors}`,
  );
  assert.doesNotThrow(() => compareBaseline(baseline, '', REPO));
});

// ------------------------------------------------------------------ parser

test('saida vazia: zero ocorrencias', () => {
  assert.deepEqual(createBaseline('', pasta()).issues, []);
  assert.deepEqual(createBaseline('\n\n  \n', pasta()).issues, []);
});

test('uma linha de erro vira uma ocorrencia com arquivo, posicao, codigo e mensagem', () => {
  const [issue] = createBaseline(`${E1}\n`, pasta()).issues;
  assert.deepEqual(
    { ...issue },
    { file: 'src/a.ts', line: 3, column: 7, severity: 'error', code: 'TS2322', message: "Type 'string' is not assignable to type 'number'.", contextHash: null },
  );
});

test('mensagem em varias linhas (continuacao indentada) e juntada na mesma ocorrencia', () => {
  const saida = `${E1}\n  Type 'string' is not assignable to type 'number'.\n    Detalhe aninhado.\n${E2}\n`;
  const { issues } = createBaseline(saida, pasta());
  assert.equal(issues.length, 2);
  assert.equal(issues[0].message, "Type 'string' is not assignable to type 'number'. Type 'string' is not assignable to type 'number'. Detalhe aninhado.");
});

test('CRLF e CR soltos dao o mesmo resultado que LF', () => {
  const root = pasta();
  const lf = `${E1}\n  continua\n${E2}\n`;
  assert.deepEqual(createBaseline(lf.replace(/\n/g, '\r\n'), root), createBaseline(lf, root));
  assert.deepEqual(createBaseline(lf.replace(/\n/g, '\r'), root), createBaseline(lf, root));
});

test('caminho Windows (barra invertida) casa com o mesmo arquivo em barra normal', () => {
  const root = pasta();
  const windows = "src\\components\\X.tsx(3,7): error TS2322: Type 'a' is not assignable to type 'b'.";
  const posix = "src/components/X.tsx(3,7): error TS2322: Type 'a' is not assignable to type 'b'.";
  assert.equal(createBaseline(windows, root).issues[0].file, 'src/components/X.tsx');
  const r = compareBaseline(createBaseline(windows, root), posix, root);
  assert.deepEqual([r.added.length, r.removed.length], [0, 0]);
});

test('caminho absoluto dentro do root e relativizado; fora do root fica com ../', () => {
  const root = pasta();
  const { issues } = createBaseline(
    `${path.join(root, 'src/a.ts')}(1,1): error TS1: x\n${path.join(root, '..', 'irmao/b.ts')}(1,1): error TS1: y\n`,
    root,
  );
  assert.deepEqual(issues.map((i) => i.file).sort(), ['../irmao/b.ts', 'src/a.ts']);
});

test('nome de arquivo com espaco, acento e parenteses e preservado', () => {
  const { issues } = createBaseline("src/meu código (1).ts(3,4): error TS2304: Cannot find name 'x'.\n", pasta());
  assert.equal(issues[0].file, 'src/meu código (1).ts');
  assert.deepEqual([issues[0].line, issues[0].column], [3, 4]);
});

test('linha solta depois do erro (resumo do tsc, aviso do Node) nao entra na mensagem', () => {
  const root = pasta();
  const limpo = createBaseline(`${E1}\n`, root);
  const comRuido = `${E1}\n\nFound 1 error.\n(node:123) Warning: algo no stderr\n    at trace (node:internal)\n`;
  assert.equal(createBaseline(comRuido, root).issues[0].message, limpo.issues[0].message);
  const r = compareBaseline(limpo, comRuido, root);
  assert.deepEqual([r.currentCount, r.added.length, r.removed.length], [1, 0, 0]);
});

test('ruido antes do primeiro erro e ignorado', () => {
  const { issues } = createBaseline(`Projects in this build:\n    * tsconfig.json\n\n${E1}\n`, pasta());
  assert.equal(issues.length, 1);
});

test('ordem do baseline e por codigo de caractere (igual em qualquer locale) e independe da ordem da saida', () => {
  const root = pasta();
  const linhas = ['src/a.ts(1,1): error TS1: z', 'src/B.ts(1,1): error TS1: z', 'src/á.ts(1,1): error TS1: z', 'src/_x.ts(1,1): error TS1: z'];
  const a = createBaseline(linhas.join('\n'), root);
  const b = createBaseline([...linhas].reverse().join('\n'), root);
  assert.deepEqual(a, b);
  assert.deepEqual(a.issues.map((i) => i.file), ['src/B.ts', 'src/_x.ts', 'src/a.ts', 'src/á.ts']);
});

// ------------------------------------------------------------------ comparacao (a catraca)

test('baseline vazio + saida vazia: nada novo', () => {
  const r = compareBaseline({ schemaVersion: 2, issues: [] }, '', pasta());
  assert.deepEqual(r, { baselineCount: 0, currentCount: 0, added: [], removed: [] });
});

test('erro que nao esta no baseline e novo', () => {
  const root = pasta();
  const r = compareBaseline(createBaseline(E1, root), `${E1}\n${E2}\n`, root);
  assert.equal(r.added.length, 1);
  assert.equal(r.added[0].file, 'src/b.tsx');
  assert.equal(r.removed.length, 0);
});

test('erro corrigido aparece como removido e nao falha', () => {
  const root = pasta();
  const r = compareBaseline(createBaseline(`${E1}\n${E2}\n`, root), E1, root);
  assert.deepEqual([r.added.length, r.removed.length], [0, 1]);
});

test('mesmo erro em outra linha/coluna continua sendo o erro conhecido', () => {
  const root = pasta();
  const r = compareBaseline(createBaseline(E1, root), E1.replace('(3,7)', '(48,2)'), root);
  assert.deepEqual([r.added.length, r.removed.length], [0, 0]);
});

test('multiset: 2 iguais no baseline e 3 na saida = 1 novo; 3 e 2 = 1 removido', () => {
  const root = pasta();
  const dois = `${E1}\n${E1.replace('(3,7)', '(9,7)')}\n`;
  const tres = `${dois}${E1.replace('(3,7)', '(20,7)')}\n`;
  assert.equal(compareBaseline(createBaseline(dois, root), tres, root).added.length, 1);
  assert.equal(compareBaseline(createBaseline(tres, root), dois, root).removed.length, 1);
});

test('mesma mensagem em arquivo diferente e erro novo', () => {
  const root = pasta();
  const r = compareBaseline(createBaseline(E1, root), E1.replace('src/a.ts', 'src/z.ts'), root);
  assert.deepEqual([r.added.length, r.removed.length], [1, 1]);
});

test('"... N more ..." com N diferente nao vira erro novo', () => {
  const root = pasta();
  const com = (n) => `src/a.ts(1,1): error TS2345: Argument of type '"x"' is not assignable to parameter of type '"a" | "b" | ... ${n} more ... | "z"'.`;
  const r = compareBaseline(createBaseline(com(12), root), com(13), root);
  assert.deepEqual([r.added.length, r.removed.length], [0, 0]);
});

test('ancora de contexto: corrigir uma ocorrencia e criar outra identica em outro trecho e detectado', () => {
  const root = pasta();
  const msg = "error TS18047: 'contact.tags' is possibly 'null'.";
  escrever(root, 'src/a.ts', 'const a = 1;\nuse(contact.tags.length);\nconst b = 2;\nconst c = 3;\nrender(contact.tags[0]);\nconst d = 4;\n');
  const baseline = createBaseline(`src/a.ts(2,5): ${msg}\nsrc/a.ts(5,8): ${msg}\n`, root);
  assert.ok(baseline.issues.every((i) => typeof i.contextHash === 'string'));

  // Linha 5 corrigida; aparece uma ocorrencia nova, identica na mensagem, num trecho novo.
  escrever(root, 'src/a.ts', 'const a = 1;\nuse(contact.tags.length);\nconst b = 2;\nconst c = 3;\nrender(tags[0]);\nconst d = 4;\nnovo(contact.tags.join());\n');
  const r = compareBaseline(baseline, `src/a.ts(2,5): ${msg}\nsrc/a.ts(7,6): ${msg}\n`, root);
  assert.deepEqual([r.added.length, r.removed.length], [1, 1]);
  assert.equal(r.added[0].line, 7);
});

test('ancora de contexto sobrevive a deslocamento de linha no arquivo', () => {
  const root = pasta();
  const msg = "error TS18047: 'x' is possibly 'null'.";
  escrever(root, 'src/a.ts', 'antes();\nx.y();\ndepois();\n');
  const baseline = createBaseline(`src/a.ts(2,1): ${msg}\n`, root);
  escrever(root, 'src/a.ts', '// comentario novo\n\n\nantes();\nx.y();\ndepois();\n');
  const r = compareBaseline(baseline, `src/a.ts(5,1): ${msg}\n`, root);
  assert.deepEqual([r.added.length, r.removed.length], [0, 0]);
});

test('baseline invalido e recusado: nulo, schema antigo, issues que nao e lista, item sem campos', () => {
  for (const ruim of [null, {}, { schemaVersion: 1, issues: [] }, { schemaVersion: 2, issues: {} }, { schemaVersion: 2, issues: [{ file: 'a.ts' }] }, { schemaVersion: 2, issues: [null] }]) {
    assert.throws(() => compareBaseline(ruim, '', pasta()), /Baseline de typecheck invalido/, JSON.stringify(ruim));
  }
});

// ------------------------------------------------------------------ resultado do compilador

test('exit 0 e sempre aceito, inclusive com saida vazia', () => {
  assert.equal(assertUsableCompilerResult(0, '', pasta()), '');
});

test('exit 1 e 2 com diagnostico parseavel sao aceitos', () => {
  assert.equal(assertUsableCompilerResult(1, E1, pasta()), E1);
  assert.equal(assertUsableCompilerResult(2, E1, pasta()), E1);
});

test('exit 1/2 sem diagnostico parseavel e recusado (falso zero)', () => {
  assert.throws(() => assertUsableCompilerResult(2, "error TS5083: Cannot read file 'tsconfig.json'.", pasta()), /sem nenhum diagnostico TypeScript parseavel/);
  assert.throws(() => assertUsableCompilerResult(1, '', pasta()), /Saida do compilador: \(vazia\)/);
});

test('qualquer outro exit (3, 134, null de sinal) e falha do compilador', () => {
  for (const status of [3, 134, null, -1]) {
    assert.throws(() => assertUsableCompilerResult(status, E1, pasta()), /tsc -b falhou com exit/);
  }
});

// ------------------------------------------------------------------ CLI com --output

test('CLI: saida vazia contra baseline vazio sai 0', () => {
  const root = pasta();
  baselineVazio(root);
  const r = cli(root, { saida: '' });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /Typecheck ratchet: baseline=0, atual=0, removidas=0, novas=0/);
  assert.match(r.out, /OK: nenhum novo erro de tipo foi introduzido\./);
});

test('CLI: erro novo sai 1 e lista arquivo(linha,coluna) codigo e mensagem', () => {
  const root = pasta();
  baselineVazio(root);
  const r = cli(root, { saida: `${E1}\n${E2}\n` });
  assert.equal(r.status, 1);
  assert.match(r.out, /baseline=0, atual=2, removidas=0, novas=2/);
  assert.match(r.err, /FALHA: novos erros de tipo detectados:/);
  assert.ok(r.err.includes("  src/a.ts(3,7) error TS2322 - Type 'string' is not assignable to type 'number'."));
  assert.ok(r.err.includes("  src/b.tsx(10,1) error TS2304 - Cannot find name 'foo'."));
});

test('CLI: mais de 50 erros novos lista 50 e resume o resto', () => {
  const root = pasta();
  baselineVazio(root);
  const saida = Array.from({ length: 63 }, (_, i) => `src/f${i}.ts(1,1): error TS2304: Cannot find name 'n${i}'.`).join('\n');
  const r = cli(root, { saida });
  assert.equal(r.status, 1);
  assert.equal(r.err.split('\n').filter((l) => l.startsWith('  src/f')).length, 50);
  assert.match(r.err, /\.\.\. e mais 13 ocorrencias\./);
});

test('CLI: erro corrigido sai 0 e avisa que o baseline pode descer', () => {
  const root = pasta();
  gravarBaseline(root, `${E1}\n${E2}\n`);
  const r = cli(root, { saida: `${E1}\n` });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /baseline=2, atual=1, removidas=1, novas=0/);
  assert.match(r.out, /--update-baseline/, 'tem de dizer como travar o ganho');
});

test('CLI: sem nada removido nao sugere --update-baseline', () => {
  const root = pasta();
  gravarBaseline(root, `${E1}\n`);
  const r = cli(root, { saida: `${E1}\n` });
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.out, /--update-baseline/);
});

test('CLI: baseline ausente sai 2 dizendo o caminho', () => {
  const root = pasta();
  const r = cli(root, { saida: '' });
  assert.equal(r.status, 2);
  assert.match(r.err, /ERRO no typecheck ratchet: Nao foi possivel ler baseline de typecheck em .*typecheck-baseline\.json/);
});

test('CLI: baseline corrompido (JSON truncado, vazio, schema antigo, item quebrado) sai 2', () => {
  for (const conteudo of ['{"schemaVersion": 2, "issues": [', '', '{"schemaVersion":1,"issues":[]}', '{"schemaVersion":2,"issues":[{"file":"a.ts"}]}']) {
    const root = pasta();
    escrever(root, 'scripts/ci/typecheck-baseline.json', conteudo);
    const r = cli(root, { saida: `${E1}\n` });
    assert.equal(r.status, 2, conteudo);
    assert.match(r.err, /ERRO no typecheck ratchet: /);
    assert.doesNotMatch(r.err, /Cannot read properties/, 'o erro tem de dizer que o baseline e invalido');
  }
});

test('CLI: --output apontando para arquivo inexistente sai 2', () => {
  const root = pasta();
  baselineVazio(root);
  const r = cli(root, { args: ['--output', 'nao-existe.txt'] });
  assert.equal(r.status, 2);
  assert.match(r.err, /ERRO no typecheck ratchet: /);
});

test('CLI: argumento desconhecido e valor ausente saem 2; --help sai 0', () => {
  const root = pasta();
  baselineVazio(root);
  assert.match(cli(root, { args: ['--nao-existe'] }).err, /Argumento desconhecido: --nao-existe\./);
  assert.equal(cli(root, { args: ['--nao-existe'] }).status, 2);
  const semValor = spawnSync(process.execPath, [RATCHET, '--baseline'], { encoding: 'utf8' });
  assert.equal(semValor.status, 2);
  assert.match(semValor.stderr, /Valor ausente para --baseline\./);
  const ajuda = spawnSync(process.execPath, [RATCHET, '--help'], { encoding: 'utf8' });
  assert.equal(ajuda.status, 0);
  assert.match(ajuda.stdout, /--update-baseline/);
});

test('CLI: --baseline relativo e resolvido a partir do --root, nao do cwd', () => {
  const root = pasta();
  escrever(root, 'outro/base.json', JSON.stringify({ schemaVersion: 2, issues: [] }));
  const r = cli(root, { saida: '', args: ['--baseline', 'outro/base.json'], cwd: os.tmpdir() });
  assert.equal(r.status, 0, r.tudo);
});

test('CLI: --update-baseline grava arquivo deterministico e e idempotente', () => {
  const root = pasta();
  const r1 = cli(root, { saida: `${E2}\n${E1}\n`, args: ['--update-baseline', '--baseline', 'b.json'] });
  assert.equal(r1.status, 0, r1.tudo);
  assert.match(r1.out, /Baseline de typecheck atualizado: 2 ocorrencias/);
  const primeiro = fs.readFileSync(path.join(root, 'b.json'), 'utf8');
  cli(root, { saida: `${E1}\n${E2}\n`, args: ['--update-baseline', '--baseline', 'b.json'] });
  assert.equal(fs.readFileSync(path.join(root, 'b.json'), 'utf8'), primeiro);
  assert.ok(primeiro.endsWith('}\n'));
  assert.deepEqual(JSON.parse(primeiro).issues.map((i) => i.file), ['src/a.ts', 'src/b.tsx']);
  assert.equal(cli(root, { saida: `${E1}\n${E2}\n`, args: ['--baseline', 'b.json'] }).status, 0);
});

test('CLI: --update-baseline que AUMENTA a divida avisa que precisa de aprovacao; que diminui, nao', () => {
  const root = pasta();
  gravarBaseline(root, `${E1}\n`);
  const sobe = cli(root, { saida: `${E1}\n${E2}\n${E3}\n`, args: ['--update-baseline'] });
  assert.equal(sobe.status, 0);
  assert.match(sobe.err, /ATENCAO: o baseline subiu de 1 para 3/);
  const desce = cli(root, { saida: `${E1}\n`, args: ['--update-baseline'] });
  assert.equal(desce.status, 0);
  assert.equal(desce.err, '');
});

// ------------------------------------------------------------------ CLI rodando o "tsc"

test('tsc: sem TypeScript instalado sai 2 dizendo onde procurou', () => {
  const root = pasta();
  baselineVazio(root);
  const r = cli(root);
  assert.equal(r.status, 2);
  assert.match(r.err, /TypeScript local nao encontrado/);
  assert.ok(r.err.includes(path.join(root, 'node_modules')), r.err);
});

test('tsc: chamado como `-b --force` no root; exit 0 e saida vazia passam', () => {
  const root = pasta();
  baselineVazio(root);
  tscFalso(root);
  const r = cli(root, { cwd: os.tmpdir() });
  assert.equal(r.status, 0, r.tudo);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'args-do-tsc.json'), 'utf8')), ['-b', '--force']);
});

test('tsc: erros no stdout com exit 2 viram erro novo (exit 1)', () => {
  const root = pasta();
  baselineVazio(root);
  tscFalso(root);
  const r = cli(root, { env: { FAKE_TSC_STDOUT: `${E1}\n`, FAKE_TSC_EXIT: '2' } });
  assert.equal(r.status, 1);
  assert.match(r.out, /novas=1/);
});

test('tsc: aviso do Node no stderr nao altera a chave do erro conhecido', () => {
  const root = pasta();
  gravarBaseline(root, `${E1}\n`);
  tscFalso(root);
  const r = cli(root, {
    env: { FAKE_TSC_STDOUT: `${E1}\n`, FAKE_TSC_STDERR: '(node:1) [DEP0040] DeprecationWarning: modulo antigo\n', FAKE_TSC_EXIT: '2' },
  });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /baseline=1, atual=1, removidas=0, novas=0/);
});

test('tsc: exit 2 sem diagnostico parseavel sai 2 e NAO sobrescreve o baseline com zero', () => {
  const root = pasta();
  const arquivo = gravarBaseline(root, `${E1}\n`);
  const antes = fs.readFileSync(arquivo, 'utf8');
  tscFalso(root);
  const env = { FAKE_TSC_STDOUT: "error TS5083: Cannot read file 'tsconfig.json'.\n", FAKE_TSC_EXIT: '2' };
  assert.equal(cli(root, { env }).status, 2);
  const r = cli(root, { env, args: ['--update-baseline'] });
  assert.equal(r.status, 2);
  assert.match(r.err, /se recusa a tratar isso como zero erros/);
  assert.equal(fs.readFileSync(arquivo, 'utf8'), antes);
});

test('tsc: exit inesperado (3) e morte por sinal saem 2', () => {
  const root = pasta();
  baselineVazio(root);
  tscFalso(root);
  assert.equal(cli(root, { env: { FAKE_TSC_EXIT: '3' } }).status, 2);
  const morto = cli(root, { env: { FAKE_TSC_SINAL: 'SIGKILL' } });
  assert.equal(morto.status, 2);
  assert.match(morto.err, /tsc -b falhou com exit null/);
});

test('tsc: o tsconfig.tsbuildinfo criado pelo run e removido (nao fica lixo na raiz)', () => {
  const root = pasta();
  baselineVazio(root);
  tscFalso(root);
  for (const env of [{}, { FAKE_TSC_STDOUT: `${E1}\n`, FAKE_TSC_EXIT: '2' }, { FAKE_TSC_EXIT: '3' }]) {
    cli(root, { env });
    assert.equal(fs.existsSync(path.join(root, 'tsconfig.tsbuildinfo')), false, JSON.stringify(env));
  }
});

test('tsc: tsconfig.tsbuildinfo que ja existia antes do run e preservado', () => {
  const root = pasta();
  baselineVazio(root);
  tscFalso(root);
  escrever(root, 'tsconfig.tsbuildinfo', '{"do":"usuario"}');
  assert.equal(cli(root).status, 0);
  assert.equal(fs.existsSync(path.join(root, 'tsconfig.tsbuildinfo')), true);
});

test('tsc: como o workflow chama (cwd = raiz, sem argumentos, 2>&1 | tee)', () => {
  const root = pasta();
  baselineVazio(root);
  tscFalso(root);
  fs.mkdirSync(path.join(root, 'scripts/ci'), { recursive: true });
  fs.copyFileSync(RATCHET, path.join(root, 'scripts/ci/typecheck-ratchet.mjs'));
  const sh = (env) =>
    spawnSync('bash', ['-c', 'set -o pipefail; if node scripts/ci/typecheck-ratchet.mjs 2>&1 | tee tsc.log; then echo passed=true; else echo passed=false; fi'], {
      cwd: root,
      env: { PATH: process.env.PATH, ...env },
      encoding: 'utf8',
    });
  assert.match(sh({}).stdout, /passed=true/);
  const falhou = sh({ FAKE_TSC_STDOUT: `${E1}\n`, FAKE_TSC_EXIT: '2' });
  assert.match(falhou.stdout, /passed=false/);
  assert.match(fs.readFileSync(path.join(root, 'tsc.log'), 'utf8'), /FALHA: novos erros de tipo detectados:/);
});

// Testes de scripts/check-warning-budget.mjs (`npm run lint:budget`, job "Warning Budget Gate").
// ESLint e tsc são o stub de `npx` (helpers.mjs): o teste dita a saída e o exit code de cada um.
// Rodar: node --test scripts/gates/check-warning-budget.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, escreve, stub, roda, limpa, STUB_NPX, eslintJson } from './helpers.mjs';

const SCRIPT = 'check-warning-budget.mjs';
const root = fixture(SCRIPT);
after(() => limpa(root));
stub(root, 'npx', STUB_NPX);

const TETO = { $comment: 'x', lintWarnings: 10, lintErrors: 0, tsErrors: 0 };
const ERRO_TS = "src/a.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.";

// orcamento: objeto (vira JSON), string (conteúdo cru) ou null (sem arquivo).
function gate({ orcamento = TETO, warnings = 0, errors = 0, env = {} } = {}) {
  const arq = path.join(root, '.warning-budget.json');
  if (orcamento === null) fs.rmSync(arq, { force: true });
  else escreve(root, '.warning-budget.json', typeof orcamento === 'string' ? orcamento : JSON.stringify(orcamento, null, 2));
  return roda(root, SCRIPT, { env: { ESLINT_OUT: eslintJson(root, warnings, errors), ESLINT_EXIT: warnings + errors > 0 ? '1' : '0', ...env } });
}
const linha = (r, rotulo) => r.stdout.split('\n').find((l) => l.includes(rotulo)) ?? '';

test('abaixo do teto: passa', () => {
  const r = gate({ warnings: 5 });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /\[OK\].* 5 \/ 10/);
  assert.match(r.stdout, /All checks within budget/);
});

test('igual ao teto: passa', () => {
  const r = gate({ warnings: 10 });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /\[OK\].* 10 \/ 10/);
});

test('um warning acima do teto: falha', () => {
  const r = gate({ warnings: 11 });
  assert.equal(r.status, 1, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /\[FAIL\].* 11 \/ 10/);
  assert.match(r.stderr, /Budget exceeded: eslint warnings/);
});

test('erro de ESLint: falha', () => {
  const r = gate({ errors: 1 });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /Budget exceeded: eslint errors/);
});

test('erro de TS com o exit 2 do tsc real: mostra a tabela, a contagem e a saída do tsc', () => {
  const r = gate({ env: { TSC_OUT: ERRO_TS, TSC_EXIT: '2' } });
  assert.equal(r.status, 1, r.saida);
  assert.match(linha(r, 'TypeScript errors'), /\[FAIL\].* 1 \/ 0/);
  assert.match(r.stderr, /Budget exceeded: typescript errors/);
  assert.match(r.stderr, /TS2322/);
});

test('erro de TS dentro do orçamento (TS_ERROR_BUDGET): passa', () => {
  const r = gate({ env: { TSC_OUT: `${ERRO_TS}\nsrc/b.ts(2,1): error TS2304: Cannot find name 'x'.`, TSC_EXIT: '2', TS_ERROR_BUDGET: '2' } });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'TypeScript errors'), /\[OK\].* 2 \/ 2/);
});

test('erro em .json importado (resolveJsonModule) é erro de código, não de tooling', () => {
  const r = gate({ env: { TSC_OUT: "src/dados.json(1,1): error TS1005: '{' expected.", TSC_EXIT: '2', TS_ERROR_BUDGET: '1' } });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'TypeScript errors'), /\[OK\].* 1 \/ 1/);
});

test('erro de TS com exit 1 também é contado', () => {
  const r = gate({ env: { TSC_OUT: ERRO_TS, TSC_EXIT: '1' } });
  assert.equal(r.status, 1, r.saida);
  assert.match(linha(r, 'TypeScript errors'), /\[FAIL\].* 1 \/ 0/);
});

const toolingQuebrado = (nome, env, re) => test(`tooling quebrado derruba o gate: ${nome}`, () => {
  const r = gate({ env: { TS_ERROR_BUDGET: '99', LINT_WARNING_BUDGET: '99', LINT_ERROR_BUDGET: '99', ...env } });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, re);
  assert.doesNotMatch(r.stdout, /All checks within budget/);
});
toolingQuebrado('tsc sai 1 sem diagnóstico (crash, npx sem o pacote)', { TSC_EXIT: '1', TSC_ERR: 'npm error npx canceled due to missing packages' }, /tsc failed to run \(exit 1\)/);
toolingQuebrado('tsc sai 2 sem diagnóstico', { TSC_EXIT: '2' }, /tsc failed to run \(exit 2\)/);
toolingQuebrado('tsc fatal sem inputs (TS18003)', { TSC_EXIT: '2', TSC_OUT: "error TS18003: No inputs were found in config file 'tsconfig.json'." }, /tsc failed to run/);
toolingQuebrado('tsc opção inválida (TS5023, exit 1)', { TSC_EXIT: '1', TSC_OUT: "error TS5023: Unknown compiler option 'x'." }, /tsc failed to run/);
toolingQuebrado('tsconfig corrompido (diagnóstico por arquivo + TS18003)', { TSC_EXIT: '2', TSC_OUT: "tsconfig.json(1,2): error TS1136: Property assignment expected.\nerror TS18003: No inputs were found in config file 'tsconfig.json'." }, /tsc failed to run/);
toolingQuebrado('tsconfig com erro de sintaxe mas com inputs (só diagnóstico do tsconfig)', { TSC_EXIT: '2', TSC_OUT: "tsconfig.json(1,2): error TS1136: Property assignment expected.\ntsconfig.json(1,5): error TS1005: '}' expected." }, /tsc failed to run/);
toolingQuebrado('tsconfig.app.json quebrado em subpasta', { TSC_EXIT: '2', TSC_OUT: 'config/tsconfig.app.json(3,1): error TS1005: x' }, /tsc failed to run/);
toolingQuebrado('tsc morto por sinal (exit 137)', { TSC_EXIT: '137' }, /tsc failed to run \(exit 137\)/);
toolingQuebrado('ESLint crash (exit 2)', { ESLINT_EXIT: '2', ESLINT_ERR: 'Oops! Something went wrong!' }, /ESLint failed to run \(exit 2\)/);
toolingQuebrado('ESLint sai 1 sem saída (npx sem o pacote)', { ESLINT_OUT: '', ESLINT_EXIT: '1' }, /Could not parse ESLint JSON output/);
toolingQuebrado('ESLint devolve texto que não é JSON', { ESLINT_OUT: 'Oops' }, /Could not parse ESLint JSON output/);
toolingQuebrado('ESLint devolve JSON que não é lista', { ESLINT_OUT: '{}' }, /ESLint/);
toolingQuebrado('ESLint não lintou nenhum arquivo ([])', { ESLINT_OUT: '[]' }, /ESLint/);
toolingQuebrado('comando não encontrado (exit 127)', { ESLINT_OUT: '', ESLINT_EXIT: '127' }, /ESLint failed to run \(exit 127\)/);

const orcamentoInvalido = (nome, opts, re = /lintWarnings/) => test(`orçamento inválido falha fechado: ${nome}`, () => {
  const r = gate({ warnings: 500, ...opts });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, re);
  assert.doesNotMatch(r.stdout, /All checks within budget/);
  assert.doesNotMatch(r.stderr, /\n\s+at /, 'não deve despejar stack trace');
});
orcamentoInvalido('arquivo ausente (antes virava teto de 740)', { orcamento: null });
orcamentoInvalido('arquivo sem lintWarnings', { orcamento: { lintErrors: 0, tsErrors: 0 } });
orcamentoInvalido('lintWarnings null', { orcamento: { ...TETO, lintWarnings: null } });
orcamentoInvalido('lintWarnings não numérico', { orcamento: { ...TETO, lintWarnings: 'abc' } });
orcamentoInvalido('lintWarnings negativo', { orcamento: { ...TETO, lintWarnings: -1 } });
orcamentoInvalido('lintWarnings fracionário', { orcamento: { ...TETO, lintWarnings: 10.5 } });
orcamentoInvalido('lintWarnings booleano', { orcamento: { ...TETO, lintWarnings: true } });
orcamentoInvalido('JSON corrompido', { orcamento: '{"lintWarnings":' }, /\.warning-budget\.json/);
orcamentoInvalido('arquivo vazio', { orcamento: '' }, /\.warning-budget\.json/);
orcamentoInvalido('JSON null', { orcamento: 'null' }, /\.warning-budget\.json/);
orcamentoInvalido('JSON array', { orcamento: '[]' }, /\.warning-budget\.json/);
orcamentoInvalido('LINT_WARNING_BUDGET não numérico (antes virava NaN e passava)', { env: { LINT_WARNING_BUDGET: 'abc' } }, /LINT_WARNING_BUDGET/);
orcamentoInvalido('LINT_WARNING_BUDGET=Infinity', { env: { LINT_WARNING_BUDGET: 'Infinity' } }, /LINT_WARNING_BUDGET/);
orcamentoInvalido('LINT_ERROR_BUDGET não numérico', { warnings: 0, errors: 3, env: { LINT_ERROR_BUDGET: 'abc' } }, /LINT_ERROR_BUDGET/);
orcamentoInvalido('TS_ERROR_BUDGET não numérico', { warnings: 0, env: { TS_ERROR_BUDGET: 'muitos', TSC_OUT: ERRO_TS, TSC_EXIT: '2' } }, /TS_ERROR_BUDGET/);
orcamentoInvalido('tsErrors não numérico no arquivo', { warnings: 0, orcamento: { ...TETO, tsErrors: 'x' } }, /tsErrors/);

test('override por env vale sobre o arquivo', () => {
  const r = gate({ warnings: 15, env: { LINT_WARNING_BUDGET: '20' } });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /15 \/ 20/);
});

test('override por env dispensa o arquivo', () => {
  const r = gate({ orcamento: null, warnings: 15, env: { LINT_WARNING_BUDGET: '20' } });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'ESLint errors'), /0 \/ 0/);
});

test('env vazia conta como não definida (usa o arquivo)', () => {
  const r = gate({ warnings: 5, env: { LINT_WARNING_BUDGET: '', LINT_ERROR_BUDGET: ' ', TS_ERROR_BUDGET: '' } });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /5 \/ 10/);
});

test('número em string no arquivo continua aceito', () => {
  const r = gate({ warnings: 5, orcamento: { ...TETO, lintWarnings: '10' } });
  assert.equal(r.status, 0, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /5 \/ 10/);
});

test('lintErrors/tsErrors ausentes no arquivo valem 0', () => {
  const r = gate({ errors: 1, orcamento: { lintWarnings: 10 } });
  assert.equal(r.status, 1, r.saida);
  assert.match(linha(r, 'ESLint errors'), /\[FAIL\].* 1 \/ 0/);
});

test('soma warnings e erros de todos os arquivos do relatório', () => {
  const relatorio = JSON.stringify([
    { filePath: '/x/a.ts', messages: [], warningCount: 4, errorCount: 0 },
    { filePath: '/x/b.ts', messages: [], warningCount: 7, errorCount: 2 },
    { filePath: '/x/c.ts', messages: [] },
  ]);
  const r = gate({ env: { ESLINT_OUT: relatorio, ESLINT_EXIT: '1' } });
  assert.equal(r.status, 1, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /\[FAIL\].* 11 \/ 10/);
  assert.match(linha(r, 'ESLint errors'), /\[FAIL\].* 2 \/ 0/);
});

test('independe do cwd', () => {
  escreve(root, '.warning-budget.json', JSON.stringify(TETO));
  const r = roda(root, SCRIPT, { cwd: path.join(root, 'bin'), env: { ESLINT_OUT: eslintJson(root, 11, 0), ESLINT_EXIT: '1' } });
  assert.equal(r.status, 1, r.saida);
  assert.match(linha(r, 'ESLint warnings'), /11 \/ 10/);
});

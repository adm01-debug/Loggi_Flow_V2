// Testes de scripts/generate-quality-report.mjs (`npm run quality:report`), que grava
// public/quality-gate-report.json — lido por src/pages/admin/QualityGate.tsx. Aqui o arquivo
// gerado é sempre o da fixture.
// Rodar: node --test scripts/gates/generate-quality-report.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, escreve, stub, roda, limpa, STUB_NPX } from './helpers.mjs';

const SCRIPT = 'generate-quality-report.mjs';
const root = fixture(SCRIPT);
after(() => limpa(root));
stub(root, 'npx', STUB_NPX);
const SAIDA = path.join(root, 'public/quality-gate-report.json');
const TETO = { lintWarnings: 10, lintErrors: 0, tsErrors: 0 };
const ERROS_TS = "src/a.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.\nsrc/so-ts.ts(3,1): error TS2304: Cannot find name 'x'.";

const arquivo = (rel, messages) => ({
  filePath: path.join(root, rel),
  messages,
  warningCount: messages.filter((m) => m.severity === 1).length,
  errorCount: messages.filter((m) => m.severity === 2).length,
});
const ESLINT = JSON.stringify([
  arquivo('src/a.ts', [{ ruleId: 'no-x', severity: 1 }, { ruleId: null, severity: 2, fatal: true }, { ruleId: 'no-x', severity: 1 }]),
  arquivo('src/b.ts', [{ ruleId: 'no-y', severity: 1 }]),
  arquivo('src/limpo.ts', []),
]);

function gera({ orcamento = TETO, env = {}, relatorioAntigo } = {}) {
  fs.rmSync(path.join(root, 'public'), { recursive: true, force: true });
  if (relatorioAntigo !== undefined) escreve(root, 'public/quality-gate-report.json', relatorioAntigo);
  if (orcamento === null) fs.rmSync(path.join(root, '.warning-budget.json'), { force: true });
  else escreve(root, '.warning-budget.json', typeof orcamento === 'string' ? orcamento : JSON.stringify(orcamento));
  const r = roda(root, SCRIPT, { env: { ESLINT_OUT: ESLINT, ESLINT_EXIT: '1', ...env } });
  return { ...r, json: fs.existsSync(SAIDA) ? JSON.parse(fs.readFileSync(SAIDA, 'utf8')) : null };
}

test('caminho feliz: totais, regras e arquivos no formato que a página lê', () => {
  const r = gera();
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stdout, /2 files · 3 warnings · 1 errors/);
  assert.ok(!Number.isNaN(Date.parse(r.json.generatedAt)));
  assert.deepEqual(r.json.budget, TETO);
  assert.deepEqual(r.json.totals, { files: 2, warnings: 3, errors: 1 });
  assert.deepEqual(r.json.rules, [{ rule: 'no-x', warnings: 2, errors: 0 }, { rule: 'parse-error', warnings: 0, errors: 1 }, { rule: 'no-y', warnings: 1, errors: 0 }]);
  assert.deepEqual(r.json.files.map((f) => [f.file, f.warnings, f.errors, f.tsErrors]), [['src/a.ts', 2, 1, 0], ['src/b.ts', 1, 0, 0]]);
});

test('repo limpo: relatório zerado', () => {
  const r = gera({ env: { ESLINT_OUT: JSON.stringify([arquivo('src/limpo.ts', [])]), ESLINT_EXIT: '0' } });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.json.totals, { files: 0, warnings: 0, errors: 0 });
  assert.deepEqual(r.json.files, []);
});

test('erros de TS com o exit 2 do tsc real entram no relatório', () => {
  const r = gera({ env: { TSC_OUT: ERROS_TS, TSC_EXIT: '2' } });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.json.totals, { files: 3, warnings: 3, errors: 3 });
  const porArquivo = Object.fromEntries(r.json.files.map((f) => [f.file, f]));
  assert.equal(porArquivo['src/a.ts'].tsErrors, 1);
  assert.equal(porArquivo['src/a.ts'].errors, 2);
  assert.deepEqual(porArquivo['src/so-ts.ts'], { file: 'src/so-ts.ts', warnings: 0, errors: 1, tsErrors: 1, rules: [] });
});

test('erros de TS com exit 1 também entram', () => {
  const r = gera({ env: { TSC_OUT: ERROS_TS, TSC_EXIT: '1' } });
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.json.totals.errors, 3);
});

test('erro de TS em arquivo que o ESLint achou limpo aparece uma vez só', () => {
  const r = gera({ env: { TSC_OUT: "src/limpo.ts(1,1): error TS2304: Cannot find name 'x'.", TSC_EXIT: '2' } });
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.json.files.filter((f) => f.file === 'src/limpo.ts').length, 1);
  assert.equal(r.json.totals.errors, 2);
});

const naoGera = (nome, env, re) => test(`ferramenta quebrada não gera relatório falso-verde: ${nome}`, () => {
  const r = gera({ env, relatorioAntigo: '{"antigo":true}' });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, re);
  assert.deepEqual(r.json, { antigo: true }, 'o relatório anterior fica intacto');
});
naoGera('tsc sai 1 sem diagnóstico (ausente/crash)', { TSC_EXIT: '1', TSC_ERR: 'npm error npx canceled due to missing packages' }, /tsc failed \(exit 1\)/);
naoGera('tsc fatal sem inputs (TS18003)', { TSC_EXIT: '2', TSC_OUT: 'error TS18003: No inputs were found in config file.' }, /tsc failed \(exit 2\)/);
naoGera('tsc opção inválida (TS5023)', { TSC_EXIT: '1', TSC_OUT: "error TS5023: Unknown compiler option 'x'." }, /tsc failed/);
naoGera('tsconfig com erro de sintaxe', { TSC_EXIT: '2', TSC_OUT: 'tsconfig.json(1,2): error TS1136: Property assignment expected.' }, /tsc failed \(exit 2\)/);
naoGera('tsc morto por sinal', { TSC_EXIT: '137' }, /tsc failed \(exit 137\)/);
naoGera('ESLint ausente (exit 1 sem saída)', { ESLINT_OUT: '', ESLINT_EXIT: '1' }, /ESLint/);
naoGera('ESLint crash (exit 2)', { ESLINT_EXIT: '2' }, /ESLint failed \(exit 2\)/);
naoGera('ESLint devolve JSON que não é lista', { ESLINT_OUT: '{}' }, /ESLint/);
naoGera('ESLint não lintou nada ([])', { ESLINT_OUT: '[]', ESLINT_EXIT: '0' }, /ESLint/);
test('orçamento corrompido: falha e mantém o relatório anterior', () => {
  const r = gera({ orcamento: '{"lintWarnings":', relatorioAntigo: '{"antigo":true}' });
  assert.equal(r.status, 1, r.saida);
  assert.deepEqual(r.json, { antigo: true });
});

test('sem .warning-budget.json: teto de warnings sai null (a página trata)', () => {
  const r = gera({ orcamento: null });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.json.budget, { lintWarnings: null, lintErrors: 0, tsErrors: 0 });
});

test('cria public/ se não existir e independe do cwd', () => {
  fs.rmSync(path.join(root, 'public'), { recursive: true, force: true });
  escreve(root, '.warning-budget.json', JSON.stringify(TETO));
  const r = roda(root, SCRIPT, { cwd: path.join(root, 'bin'), env: { ESLINT_OUT: ESLINT, ESLINT_EXIT: '1' } });
  assert.equal(r.status, 0, r.saida);
  assert.ok(fs.existsSync(SAIDA));
});

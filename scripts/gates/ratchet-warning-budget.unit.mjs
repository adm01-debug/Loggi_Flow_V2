// Testes de scripts/ratchet-warning-budget.mjs (`npm run lint:budget:ratchet`): o teto só desce.
// O script ESCREVE em .warning-budget.json — aqui sempre o da fixture, nunca o do repo.
// Rodar: node --test scripts/gates/ratchet-warning-budget.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ_REPO, fixture, escreve, stub, roda, limpa, STUB_NPX, eslintJson } from './helpers.mjs';

const SCRIPT = 'ratchet-warning-budget.mjs';
const root = fixture(SCRIPT);
after(() => limpa(root));
stub(root, 'npx', STUB_NPX);
const ARQ = path.join(root, '.warning-budget.json');

// Mesmo formato do arquivo real (2 espaços, "$comment", newline final), com teto 10.
const ORIGINAL = `${JSON.stringify({ $comment: 'CI gate — "aspas" e acentuação', lintWarnings: 10, lintErrors: 0, tsErrors: 0, extra: { a: [1, 2] } }, null, 2)}\n`;

function ratchet({ orcamento = ORIGINAL, warnings = 0, errors = 0, env = {} } = {}) {
  if (orcamento === null) fs.rmSync(ARQ, { force: true });
  else fs.writeFileSync(ARQ, orcamento);
  const r = roda(root, SCRIPT, { env: { ESLINT_OUT: eslintJson(root, warnings, errors), ESLINT_EXIT: warnings + errors > 0 ? '1' : '0', ...env } });
  return { ...r, depois: fs.existsSync(ARQ) ? fs.readFileSync(ARQ, 'utf8') : null };
}

test('abaixo do teto: baixa só lintWarnings e preserva o resto byte a byte', () => {
  const r = ratchet({ warnings: 7 });
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stdout, /Ratcheted lintWarnings: 10 → 7 \(-3\)/);
  assert.equal(r.depois, ORIGINAL.replace('"lintWarnings": 10', '"lintWarnings": 7'));
});

test('idempotente: segunda execução não mexe no arquivo', () => {
  const primeira = ratchet({ warnings: 7 });
  const antes = fs.statSync(ARQ).mtimeMs;
  const r = ratchet({ orcamento: primeira.depois, warnings: 7 });
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stdout, /Nothing to ratchet/);
  assert.equal(r.depois, primeira.depois);
  assert.ok(fs.statSync(ARQ).mtimeMs >= antes);
});

test('igual ao teto: nada a fazer', () => {
  const r = ratchet({ warnings: 10 });
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stdout, /Nothing to ratchet/);
  assert.equal(r.depois, ORIGINAL);
});

test('zero warnings: teto vai a 0', () => {
  const r = ratchet({ warnings: 0 });
  assert.equal(r.status, 0, r.saida);
  assert.equal(JSON.parse(r.depois).lintWarnings, 0);
});

const recusa = (nome, opts, re) => test(`recusa sem tocar no arquivo: ${nome}`, () => {
  const r = ratchet(opts);
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, re);
  assert.equal(r.depois, opts.orcamento === undefined ? ORIGINAL : opts.orcamento);
  assert.doesNotMatch(r.stderr, /\n\s+at /, 'não deve despejar stack trace');
});
recusa('acima do teto (nunca sobe)', { warnings: 11 }, /Refusing to ratchet: current warnings \(11\) exceed budget \(10\)/);
recusa('muito acima do teto', { warnings: 9999 }, /Refusing to ratchet/);
recusa('há erro de ESLint', { warnings: 3, errors: 1 }, /Recusando ratchet: 1 erro/);
recusa('ESLint crash (exit 2)', { env: { ESLINT_EXIT: '2' } }, /ESLint failed to run \(exit 2\)/);
recusa('ESLint sai 1 sem saída', { env: { ESLINT_OUT: '', ESLINT_EXIT: '1' } }, /Could not parse ESLint JSON output/);
recusa('ESLint devolve texto que não é JSON', { env: { ESLINT_OUT: 'Oops' } }, /Could not parse ESLint JSON output/);
recusa('ESLint devolve JSON que não é lista', { env: { ESLINT_OUT: '{}' } }, /ESLint/);
recusa('ESLint não lintou nada ([]) — zeraria o teto', { env: { ESLINT_OUT: '[]' } }, /ESLint/);
recusa('orçamento ausente (não cria um)', { orcamento: null }, /not found/);
recusa('orçamento corrompido', { orcamento: '{"lintWarnings":' }, /inválido/);
recusa('orçamento vazio', { orcamento: '' }, /inválido/);
recusa('orçamento null', { orcamento: 'null' }, /\.warning-budget\.json/);
recusa('orçamento array', { orcamento: '[]' }, /\.warning-budget\.json/);
recusa('lintWarnings em string', { orcamento: '{"lintWarnings":"10","lintErrors":0,"tsErrors":0}' }, /campo numérico "lintWarnings"/);
recusa('sem tsErrors', { orcamento: '{"lintWarnings":10,"lintErrors":0}' }, /campo numérico "tsErrors"/);

test('override de env do gate não afrouxa o ratchet', () => {
  const r = ratchet({ warnings: 50, env: { LINT_WARNING_BUDGET: '999' } });
  assert.equal(r.status, 1, r.saida);
  assert.equal(r.depois, ORIGINAL);
});

test('o arquivo real do repo já está no formato que o ratchet grava', () => {
  const real = fs.readFileSync(path.join(RAIZ_REPO, '.warning-budget.json'), 'utf8');
  assert.equal(`${JSON.stringify(JSON.parse(real), null, 2)}\n`, real);
});

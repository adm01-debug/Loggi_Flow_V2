#!/usr/bin/env node
/**
 * Warning budget gate.
 *
 * Runs ESLint (JSON) and `tsc --noEmit`, counts issues, and fails the process
 * when they exceed the budgets defined in `.warning-budget.json`.
 *
 * Usage:
 *   node scripts/check-warning-budget.mjs
 *
 * Env overrides (used by CI matrix or local exploration):
 *   LINT_WARNING_BUDGET   — max ESLint warnings allowed (default: from JSON)
 *   LINT_ERROR_BUDGET     — max ESLint errors allowed   (default: 0)
 *   TS_ERROR_BUDGET       — max TypeScript errors       (default: 0)
 *
 * Exit codes:
 *   0 — under budget
 *   1 — over budget or tooling failure
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const budgetPath = resolve(repoRoot, '.warning-budget.json');

const defaults = { lintWarnings: 740, lintErrors: 0, tsErrors: 0 };
const fromFile = existsSync(budgetPath)
  ? JSON.parse(readFileSync(budgetPath, 'utf8'))
  : {};
const budget = {
  lintWarnings: Number(process.env.LINT_WARNING_BUDGET ?? fromFile.lintWarnings ?? defaults.lintWarnings),
  lintErrors: Number(process.env.LINT_ERROR_BUDGET ?? fromFile.lintErrors ?? defaults.lintErrors),
  tsErrors: Number(process.env.TS_ERROR_BUDGET ?? fromFile.tsErrors ?? defaults.tsErrors),
};

function runEslint() {
  const res = spawnSync(
    'npx',
    ['--no-install', 'eslint', '.', '--format', 'json'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true },
  );
  // ESLint exits 1 when warnings/errors are found — that is expected here.
  if (res.status !== 0 && res.status !== 1) {
    process.stderr.write(res.stderr || '');
    throw new Error(`ESLint failed to run (exit ${res.status}).`);
  }
  let report;
  try {
    report = JSON.parse(res.stdout);
  } catch (err) {
    throw new Error(`Could not parse ESLint JSON output: ${(err).message}`);
  }
  let warnings = 0;
  let errors = 0;
  for (const file of report) {
    warnings += file.warningCount ?? 0;
    errors += file.errorCount ?? 0;
  }
  return { warnings, errors };
}

function runTypecheck() {
  const res = spawnSync('npx', ['--no-install', 'tsc', '--noEmit', '--pretty', 'false'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    shell: true,
  });
  const output = (res.stdout || '') + (res.stderr || '');
  // tsc sai com 0 (ok), 1 (erros por arquivo) ou 2 (falha fatal: config/sem inputs).
  // Falha fatal (ex.: TS18003) não tem o formato `file(l,c): error TS...` e o regex
  // contaria 0 — um falso "dentro do orçamento". Tooling quebrado derruba o gate.
  if (res.status !== 0 && res.status !== 1) {
    process.stderr.write(output);
    throw new Error(`tsc failed to run (exit ${res.status}).`);
  }
  // Each diagnostic line looks like: `path/to/file.ts(12,34): error TS2322: ...`
  const errors = (output.match(/^.*: error TS\d+:/gm) || []).length;
  return { errors, output };
}

function format(label, actual, max) {
  const status = actual > max ? 'FAIL' : 'OK';
  return `  [${status}] ${label.padEnd(22)} ${String(actual).padStart(4)} / ${max}`;
}

console.log('Warning budget check');
console.log('====================');

const lint = runEslint();
const ts = runTypecheck();

console.log(format('ESLint warnings', lint.warnings, budget.lintWarnings));
console.log(format('ESLint errors', lint.errors, budget.lintErrors));
console.log(format('TypeScript errors', ts.errors, budget.tsErrors));

const failures = [];
if (lint.warnings > budget.lintWarnings) failures.push('eslint warnings');
if (lint.errors > budget.lintErrors) failures.push('eslint errors');
if (ts.errors > budget.tsErrors) failures.push('typescript errors');

if (failures.length > 0) {
  console.error(`\nBudget exceeded: ${failures.join(', ')}.`);
  console.error('Lower the count or update .warning-budget.json intentionally.');
  if (ts.errors > budget.tsErrors) {
    console.error('\nTypeScript output:');
    console.error(ts.output);
  }
  process.exit(1);
}

console.log('\nAll checks within budget.');

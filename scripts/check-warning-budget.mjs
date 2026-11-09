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
 *   LINT_WARNING_BUDGET   — max ESLint warnings allowed (default: from JSON; no fallback)
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

function configError(message) {
  console.error(`Invalid warning budget: ${message}`);
  process.exit(1);
}

// lintWarnings não tem default de propósito: sem o arquivo (ou sem o campo) o gate caía num teto
// fixo de 740 e passava em silêncio com 7x o orçamento real.
const defaults = { lintErrors: 0, tsErrors: 0 };
let fromFile = {};
if (existsSync(budgetPath)) {
  try {
    fromFile = JSON.parse(readFileSync(budgetPath, 'utf8'));
  } catch (err) {
    configError(`.warning-budget.json is not valid JSON (${err.message}).`);
  }
  if (fromFile === null || typeof fromFile !== 'object' || Array.isArray(fromFile)) {
    configError('.warning-budget.json must be a JSON object.');
  }
}

// Valor não numérico virava NaN, e `actual > NaN` é sempre false: o gate nunca falhava.
function resolveBudget(envName, field) {
  const fromEnv = process.env[envName];
  const raw = fromEnv !== undefined && fromEnv.trim() !== '' ? fromEnv : (fromFile[field] ?? defaults[field]);
  if (raw === undefined) {
    configError(`no value for ${field} — set it in .warning-budget.json or via ${envName}.`);
  }
  const value = typeof raw === 'string' ? Number(raw) : raw;
  if (!Number.isInteger(value) || value < 0) {
    configError(`${field} (${envName} / .warning-budget.json) must be a non-negative integer, got ${JSON.stringify(raw)}.`);
  }
  return value;
}

const budget = {
  lintWarnings: resolveBudget('LINT_WARNING_BUDGET', 'lintWarnings'),
  lintErrors: resolveBudget('LINT_ERROR_BUDGET', 'lintErrors'),
  tsErrors: resolveBudget('TS_ERROR_BUDGET', 'tsErrors'),
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
  if (!Array.isArray(report) || report.length === 0) {
    throw new Error('ESLint JSON report is empty or not a list — nothing was linted.');
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
  // O exit code do tsc não separa "há erros de tipo" de "não consegui rodar": o tsc 5 sai com 2
  // para erro de tipo comum (mesmo com --noEmit) e também para config quebrada; 1 aparece em
  // opção inválida e em crash. Quem separa é o formato: erro por arquivo é
  // `file(l,c): error TSxxxx:`; erro global/fatal (TS18003, TS5023...) vem sem arquivo, e
  // tsconfig com erro de sintaxe aparece como diagnóstico do próprio tsconfig*.json.
  // Each diagnostic line looks like: `path/to/file.ts(12,34): error TS2322: ...`
  const errors = (output.match(/^.*: error TS\d+:/gm) || []).length;
  const fatal = /^(?:error TS\d+:|(?:.*[\\/])?tsconfig[^\\/]*\.json\(\d+,\d+\): error TS\d+:)/m.test(output);
  // Saída != 0 sem nenhum erro por arquivo (npx sem o pacote, crash) contaria 0 — um falso
  // "dentro do orçamento". Tooling quebrado derruba o gate.
  if (![0, 1, 2].includes(res.status) || fatal || (res.status !== 0 && errors === 0)) {
    process.stderr.write(output);
    throw new Error(`tsc failed to run (exit ${res.status}).`);
  }
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

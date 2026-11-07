#!/usr/bin/env node
/**
 * Auto-ratchet the warning budget.
 *
 * Runs the same measurement as `check-warning-budget.mjs` but instead of failing
 * when we're under budget, it *lowers* the budget to the current count. This
 * creates a one-way ratchet: quality can only improve.
 *
 * Usage:
 *   node scripts/ratchet-warning-budget.mjs
 *   npm run lint:budget:ratchet
 *
 * Exit codes:
 *   0 — budget lowered (or already matching current count)
 *   1 — measurement tooling failure, or current count exceeds current budget
 *       (which means CI would already be failing — run the normal gate first).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const budgetPath = resolve(repoRoot, '.warning-budget.json');

if (!existsSync(budgetPath)) {
  console.error('.warning-budget.json not found — refusing to create one implicitly.');
  process.exit(1);
}

let budget;
try {
  budget = JSON.parse(readFileSync(budgetPath, 'utf8'));
} catch (err) {
  console.error(`.warning-budget.json inválido: ${err.message} — refusing to ratchet.`);
  process.exit(1);
}
for (const field of ['lintWarnings', 'lintErrors', 'tsErrors']) {
  if (typeof budget[field] !== 'number' || Number.isNaN(budget[field])) {
    console.error(`.warning-budget.json sem campo numérico "${field}" — refusing to ratchet.`);
    process.exit(1);
  }
}

const res = spawnSync(
  'npx',
  ['--no-install', 'eslint', '.', '--format', 'json'],
  { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true },
);
if (res.status !== 0 && res.status !== 1) {
  process.stderr.write(res.stderr || '');
  console.error(`ESLint failed to run (exit ${res.status}).`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(res.stdout);
} catch (err) {
  console.error(`Could not parse ESLint JSON output: ${err.message}`);
  process.exit(1);
}

let warnings = 0;
let errors = 0;
for (const file of report) {
  warnings += file.warningCount ?? 0;
  errors += file.errorCount ?? 0;
}

const prevWarnings = budget.lintWarnings;
console.log(`Current: ${warnings} warnings / ${errors} errors`);
console.log(`Budget:  ${prevWarnings} warnings / ${budget.lintErrors} errors`);

if (errors > 0) {
  console.error(
    `\nRecusando ratchet: ${errors} erro(s) de ESLint — CI estaria quebrada.`,
  );
  console.error('Corrija os erros antes de ratchetear (o gate normal já falharia).');
  process.exit(1);
}

if (warnings > prevWarnings) {
  console.error(
    `\nRefusing to ratchet: current warnings (${warnings}) exceed budget (${prevWarnings}).`,
  );
  console.error('Fix the regressions before ratcheting — CI would already be failing.');
  process.exit(1);
}

if (warnings === prevWarnings) {
  console.log('\nNothing to ratchet — budget already matches current count.');
  process.exit(0);
}

budget.lintWarnings = warnings;
writeFileSync(budgetPath, `${JSON.stringify(budget, null, 2)}\n`);
console.log(`\n✓ Ratcheted lintWarnings: ${prevWarnings} → ${warnings} (-${prevWarnings - warnings})`);
console.log('Commit .warning-budget.json to lock the improvement.');

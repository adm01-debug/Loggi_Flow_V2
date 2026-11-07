#!/usr/bin/env node
/**
 * Generates a Quality Gate report:
 *   - ESLint warnings/errors per file, grouped by rule category
 *   - TypeScript errors per file
 *   - Aggregate totals and top offenders
 *
 * Output: public/quality-gate-report.json (consumed by /admin/quality-gate)
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outPath = resolve(repoRoot, 'public/quality-gate-report.json');
const budgetPath = resolve(repoRoot, '.warning-budget.json');

function runEslint() {
  const res = spawnSync(
    'npx',
    ['--no-install', 'eslint', '.', '--format', 'json'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 },
  );
  if (res.status !== 0 && res.status !== 1) {
    process.stderr.write(res.stderr || '');
    throw new Error(`ESLint failed (exit ${res.status})`);
  }
  return JSON.parse(res.stdout);
}

function runTsc() {
  const res = spawnSync(
    'npx',
    ['--no-install', 'tsc', '--noEmit', '--pretty', 'false'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  // tsc sai com 0 (ok), 1 (erros por arquivo) ou 2 (falha fatal de config).
  // Falha fatal não produz linhas `file(l,c): error TS...`; sem este check o
  // relatório sairia falso-verde com 0 erros de TS.
  if (res.status !== 0 && res.status !== 1) {
    process.stderr.write(res.stderr || '');
    throw new Error(`tsc failed (exit ${res.status})`);
  }
  const out = (res.stdout || '') + (res.stderr || '');
  const perFile = new Map();
  const line = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm;
  let m;
  while ((m = line.exec(out)) !== null) {
    const [, file, ln, col, code, message] = m;
    const rel = relative(repoRoot, resolve(repoRoot, file));
    if (!perFile.has(rel)) perFile.set(rel, []);
    perFile.get(rel).push({ line: +ln, column: +col, code, message });
  }
  return perFile;
}

const eslintReport = runEslint();
const tsErrorsByFile = runTsc();

const files = [];
const ruleTotals = new Map();
let totalWarnings = 0;
let totalErrors = 0;

for (const f of eslintReport) {
  if ((f.warningCount ?? 0) === 0 && (f.errorCount ?? 0) === 0 && !tsErrorsByFile.has(relative(repoRoot, f.filePath))) {
    continue;
  }
  const rel = relative(repoRoot, f.filePath);
  const rules = new Map();
  for (const msg of f.messages ?? []) {
    const key = msg.ruleId ?? 'parse-error';
    const entry = rules.get(key) ?? { rule: key, warnings: 0, errors: 0 };
    if (msg.severity === 2) entry.errors += 1;
    else entry.warnings += 1;
    rules.set(key, entry);
    const t = ruleTotals.get(key) ?? { rule: key, warnings: 0, errors: 0 };
    if (msg.severity === 2) t.errors += 1;
    else t.warnings += 1;
    ruleTotals.set(key, t);
  }
  const tsErrors = tsErrorsByFile.get(rel) ?? [];
  totalWarnings += f.warningCount ?? 0;
  totalErrors += (f.errorCount ?? 0) + tsErrors.length;
  files.push({
    file: rel,
    warnings: f.warningCount ?? 0,
    errors: (f.errorCount ?? 0) + tsErrors.length,
    tsErrors: tsErrors.length,
    rules: [...rules.values()].sort((a, b) => (b.warnings + b.errors) - (a.warnings + a.errors)),
  });
}

// Include any TS-only files that had no ESLint messages
for (const [rel, errs] of tsErrorsByFile) {
  if (files.find((x) => x.file === rel)) continue;
  totalErrors += errs.length;
  files.push({ file: rel, warnings: 0, errors: errs.length, tsErrors: errs.length, rules: [] });
}

files.sort((a, b) => (b.warnings + b.errors) - (a.warnings + a.errors));

const budget = existsSync(budgetPath) ? JSON.parse(readFileSync(budgetPath, 'utf8')) : {};

const report = {
  generatedAt: new Date().toISOString(),
  budget: {
    lintWarnings: budget.lintWarnings ?? null,
    lintErrors: budget.lintErrors ?? 0,
    tsErrors: budget.tsErrors ?? 0,
  },
  totals: {
    files: files.length,
    warnings: totalWarnings,
    errors: totalErrors,
  },
  rules: [...ruleTotals.values()].sort(
    (a, b) => (b.warnings + b.errors) - (a.warnings + a.errors),
  ),
  files,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`Quality Gate report written to ${relative(repoRoot, outPath)}`);
console.log(`  ${files.length} files · ${totalWarnings} warnings · ${totalErrors} errors`);

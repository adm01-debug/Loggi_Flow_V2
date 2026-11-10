// Apoio dos testes dos gates da raiz de scripts/ (validate-*.mjs, audit-gate.mjs, *-warning-budget.mjs,
// generate-quality-report.mjs). Os gates resolvem a raiz do repo a partir do próprio caminho
// (`scripts/..`), então cada teste copia o script para `<tmp>/scripts/` e monta um repo sintético em
// `<tmp>`: nada toca o repo real. `npm`/`npx` são trocados por stubs de shell em `<tmp>/bin`, postos na
// frente do PATH — sem rede, sem ESLint/tsc de verdade.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const RAIZ_SCRIPTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RAIZ_REPO = path.resolve(RAIZ_SCRIPTS, '..');

// Overrides que mudariam o resultado se vazassem do ambiente de quem roda os testes.
const ENV_ISOLADO = ['LINT_WARNING_BUDGET', 'LINT_ERROR_BUDGET', 'TS_ERROR_BUDGET', 'AUDIT_TIMEOUT_MS'];

export function fixture(script) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.mkdirSync(path.join(root, 'bin'));
  fs.copyFileSync(path.join(RAIZ_SCRIPTS, script), path.join(root, 'scripts', script));
  return root;
}

export function escreve(root, rel, texto) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, texto);
  return p;
}

export function stub(root, nome, corpoSh) {
  const p = path.join(root, 'bin', nome);
  fs.writeFileSync(p, `#!/bin/sh\n${corpoSh}\n`);
  fs.chmodSync(p, 0o755);
}

export function roda(root, script, { env = {}, cwd = root } = {}) {
  const base = { ...process.env };
  for (const k of ENV_ISOLADO) delete base[k];
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', script)], {
    cwd,
    encoding: 'utf8',
    env: { ...base, ...env, PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH}` },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, saida: `${r.stdout}${r.stderr}` };
}

export const limpa = (root) => fs.rmSync(root, { recursive: true, force: true });

// Stub de `npx --no-install <eslint|tsc> …`: devolve o que o teste mandar por env.
export const STUB_NPX = `case "$2" in
  eslint) [ -n "$ESLINT_ERR" ] && echo "$ESLINT_ERR" >&2; [ -n "$ESLINT_OUT" ] && printf '%s' "$ESLINT_OUT"; exit "\${ESLINT_EXIT:-0}" ;;
  tsc)    [ -n "$TSC_ERR" ] && echo "$TSC_ERR" >&2; [ -n "$TSC_OUT" ] && printf '%s\\n' "$TSC_OUT"; exit "\${TSC_EXIT:-0}" ;;
  *)      echo "stub npx: chamada inesperada: $*" >&2; exit 99 ;;
esac`;

// Relatório do `eslint --format json` com um arquivo só.
export const eslintJson = (root, warnings, errors, messages = []) =>
  JSON.stringify([{ filePath: path.join(root, 'src/a.ts'), messages, warningCount: warnings, errorCount: errors }]);

// Teste do gate da raiz do repositorio (scripts/ci/check-root-files.mjs).
// O contrato e a saida e o codigo de saida do CLI, rodado sobre um diretorio sintetico.
// Rodar: node --test scripts/ci/check-root-files.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "check-root-files.mjs",
);
const temporarios = [];
after(() => {
  for (const dir of temporarios)
    fs.rmSync(dir, { recursive: true, force: true });
});

function repo(arquivos, { git = false } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "root-files-"));
  temporarios.push(raiz);
  for (const rel of arquivos) {
    const destino = path.join(raiz, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, "");
  }
  if (git) {
    spawnSync("git", ["init", "-q"], { cwd: raiz });
    spawnSync("git", ["add", "-A"], { cwd: raiz });
  }
  return raiz;
}

function rodar(raiz) {
  const r = spawnSync(process.execPath, [SCRIPT, "--root", raiz], {
    encoding: "utf8",
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

test("raiz com arquivos declarados passa", () => {
  const raiz = repo(["README.md", "package.json", "vite.config.ts"]);
  const r = rodar(raiz);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /root-files] OK: 3 arquivos/);
});

test("arquivo solto na raiz reprova e aparece na mensagem", () => {
  const raiz = repo(["README.md", "backup-antes-do-deploy.bak"]);
  const r = rodar(raiz);
  assert.equal(r.code, 1);
  assert.match(r.out, /backup-antes-do-deploy\.bak/);
  assert.match(r.out, /PERMITIDOS/);
});

test("subdiretorio nao entra na conta da raiz", () => {
  const raiz = repo(["README.md", "docs/qualquer-coisa.md", "src/App.tsx"]);
  assert.equal(rodar(raiz).code, 0);
});

test("com git, so o arquivo rastreado conta", () => {
  const r = spawnSync("git", ["--version"], { encoding: "utf8" });
  if (r.status !== 0) return;

  const raiz = repo(["README.md"], { git: true });
  fs.writeFileSync(path.join(raiz, "ignorado.log"), "");
  const limpo = rodar(raiz);
  assert.equal(limpo.code, 0, limpo.out);

  fs.writeFileSync(path.join(raiz, "Relatorio Final.txt"), "");
  spawnSync("git", ["add", "-A"], { cwd: raiz });
  const sujo = rodar(raiz);
  assert.equal(sujo.code, 1);
  assert.match(sujo.out, /Relatorio Final\.txt/);
});

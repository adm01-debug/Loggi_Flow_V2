// Teste do gate que impede `.env` rastreado (scripts/ci/check-env-not-tracked.mjs).
// Cada caso monta um repositorio git sintetico num diretorio temporario e roda o CLI como subprocesso:
// o script nao expoe funcao, o contrato e a saida e o codigo de saida.
// Rodar: node --test scripts/ci/check-env-not-tracked.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-env-not-tracked.mjs");
const temporarios = [];
after(() => {
  for (const dir of temporarios) fs.rmSync(dir, { recursive: true, force: true });
});

function git(raiz, ...args) {
  const r = spawnSync("git", ["-C", raiz, ...args], { encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")} falhou: ${r.stderr}`);
  return r.stdout;
}

// arquivos: { ".env": "SEGREDO=1" }. Com `forcar: false` o `git add` respeita o .gitignore, que e como
// se deixa um `.env` no disco sem estar no indice.
function repo(arquivos, { forcar = true } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "env-git-"));
  temporarios.push(raiz);
  git(raiz, "init", "-q");
  git(raiz, "config", "user.email", "teste@exemplo.invalid");
  git(raiz, "config", "user.name", "Teste");
  git(raiz, "config", "commit.gpgsign", "false");
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    const destino = path.join(raiz, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, conteudo);
  }
  git(raiz, "add", "-A", ...(forcar ? ["-f"] : []));
  return raiz;
}

function run(raiz, ...extras) {
  return spawnSync(process.execPath, [SCRIPT, "--root", raiz, ...extras], { encoding: "utf8" });
}

test("so o .env.example rastreado passa", () => {
  const r = run(repo({ ".env.example": "SUPABASE_URL=\n", "README.md": "oi\n" }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /nenhum arquivo de ambiente rastreado/);
  assert.match(r.stdout, /2 caminhos conferidos/);
});

test(".env rastreado reprova e diz como tirar do indice", () => {
  const r = run(repo({ ".env": "SUPABASE_ANON_KEY=x\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /::error::\.env esta rastreado/);
  assert.match(r.stderr, /git rm --cached "\.env"/);
});

test("variantes .env.local e .env.production tambem reprovam", () => {
  for (const nome of [".env.local", ".env.production", ".env.test"]) {
    const r = run(repo({ [nome]: "X=1\n" }));
    assert.equal(r.status, 1, `${nome} deveria reprovar`);
    assert.match(r.stderr, new RegExp(`::error::${nome.replace(/\./g, "\\.")} esta rastreado`));
  }
});

test("arquivo de ambiente em subpasta aparece com o caminho completo", () => {
  const r = run(repo({ "supabase/.env": "X=1\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /::error::supabase\/\.env esta rastreado/);
});

test(".env no disco mas ignorado pelo git nao reprova (o gate olha o indice)", () => {
  const raiz = repo({ ".gitignore": ".env\n", ".env": "X=1\n", "README.md": "oi\n" }, { forcar: false });
  assert.equal(fs.existsSync(path.join(raiz, ".env")), true);
  const r = run(raiz);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /2 caminhos conferidos/);
});

test("diretorio que nao e repositorio git sai 2 (falha do proprio gate)", () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "env-git-nao-"));
  temporarios.push(raiz);
  const r = run(raiz);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Nao foi possivel ler o indice do git/);
});

test("--root sem valor sai 2", () => {
  const r = spawnSync(process.execPath, [SCRIPT, "--root"], { encoding: "utf8" });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--root exige um caminho/);
});

test("sem git no PATH sai 2 em vez de verde falso", () => {
  const r = spawnSync(process.execPath, [SCRIPT, "--root", "/tmp"], {
    encoding: "utf8",
    env: { PATH: "" },
  });
  assert.equal(r.status, 2, r.stdout + r.stderr);
});

test("sem --root confere o proprio repositorio em que o script esta", () => {
  const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: os.tmpdir() });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /nenhum arquivo de ambiente rastreado/);
});

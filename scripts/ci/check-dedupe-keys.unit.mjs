// Teste do gate de chave de dedupe (scripts/ci/check-dedupe-keys.mjs).
// Cada caso monta um `supabase/functions/<nome>/index.ts` num diretorio temporario e roda o CLI como
// subprocesso: o script nao expoe funcao, o contrato e a saida e o codigo de saida.
// Rodar: node --test scripts/ci/check-dedupe-keys.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-dedupe-keys.mjs");
const temporarios = [];
after(() => {
  for (const dir of temporarios) fs.rmSync(dir, { recursive: true, force: true });
});

// arquivos: { "webhook-a/index.ts": "codigo" } — o root ja ganha o prefixo supabase/functions.
function repo(arquivos) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "dedupe-"));
  temporarios.push(raiz);
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    const destino = path.join(raiz, "supabase", "functions", rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, conteudo);
  }
  return raiz;
}

function run(raiz, ...extras) {
  return spawnSync(process.execPath, [SCRIPT, "--root", raiz, ...extras], { encoding: "utf8" });
}

test("chave montada com campo estavel do evento passa", () => {
  const r = run(repo({ "webhook-a/index.ts": "const eventKey = await buildEventKey('a', [eventId]);\n" }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /1 arquivos index\.ts conferidos/);
});

test("crypto.randomUUID() na chave reprova com arquivo e linha", () => {
  const r = run(repo({ "webhook-a/index.ts": "// cabecalho\nconst eventId = crypto.randomUUID();\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /::error::Chave de dedupe construida com valor aleatorio ou relogio/);
  assert.match(r.stderr, /supabase\/functions\/webhook-a\/index\.ts:2/);
});

test("Date.now() na chave idempotente reprova, mesmo entre crases", () => {
  const r = run(repo({ "webhook-b/index.ts": "const idempotencyKey = `${id}-${Date.now()}`;\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /webhook-b\/index\.ts:1/);
});

test("quebra de linha entre o nome e a chamada nao escapa", () => {
  const r = run(repo({ "webhook-c/index.ts": "const eventId =\n  crypto.randomUUID();\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /webhook-c\/index\.ts:1/);
});

test("encadeamento depois da chamada aleatoria tambem reprova", () => {
  const r = run(repo({ "webhook-d/index.ts": "const event_key = crypto.randomUUID().replace(/-/g, '');\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /webhook-d\/index\.ts:1/);
});

test("relogio e aleatorio fora de chave de dedupe nao reprovam", () => {
  const r = run(
    repo({
      "health/index.ts": "const startTime = Date.now();\nconst latency = Date.now() - startTime;\n",
      "api/index.ts": 'const timestamp = Date.now().toString();\nfetch(url, { headers: { "Request-ID": crypto.randomUUID() } });\n',
      "monitor/index.ts": "const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();\n",
    }),
  );
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /3 arquivos index\.ts conferidos/);
});

test("comentario depois da chave nao reprova codigo limpo", () => {
  const r = run(repo({ "webhook-e/index.ts": "const idempotencyKey = montarChave(payload); // antes era Date.now()\n" }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("codigo comentado nao reprova", () => {
  const r = run(
    repo({ "webhook-f/index.ts": "// const eventId = crypto.randomUUID();\n/* idempotencyKey: Date.now() */\nconst eventKey = buildEventKey(payload);\n" }),
  );
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("nome de chave em outra forma (event_key, eventKey, idempotencia) e pego", () => {
  for (const nome of ["event_key", "eventKey", "idempotenciaChave"]) {
    const r = run(repo({ "webhook-g/index.ts": `const ${nome} = Date.now();\n` }));
    assert.equal(r.status, 1, `${nome} deveria reprovar`);
    assert.match(r.stderr, /webhook-g\/index\.ts:1/);
  }
});

test("sem index.ts o gate reprova em vez de dar verde falso", () => {
  const r = run(repo({ "webhook-h/helper.ts": "export const x = 1;\n" }));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Nenhum index\.ts encontrado/);
});

test("--root sem valor sai 2", () => {
  const r = spawnSync(process.execPath, [SCRIPT, "--root"], { encoding: "utf8" });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--root exige um caminho/);
});

test("sem --root confere o repositorio em que o script esta", () => {
  const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: os.tmpdir() });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /nenhuma chave com crypto\.randomUUID\(\) ou Date\.now\(\)/);
});

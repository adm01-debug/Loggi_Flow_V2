// Teste do guard de teto de listagem (scripts/ci/validate-query-limits.mjs).
// Cada caso monta um repositório sintético (src/ + allowlist) num diretório temporário e roda o CLI
// como subprocesso: o script não expõe função, o contrato é a saída e o código de saída.
// Rodar: node --test scripts/ci/validate-query-limits.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "validate-query-limits.mjs");
const temporarios = [];
after(() => {
  for (const dir of temporarios) fs.rmSync(dir, { recursive: true, force: true });
});

// arquivos: { "src/hooks/x.tsx": "conteudo" }; allowlist: objeto gravado ao lado do src/.
function repo(arquivos, { allowlist = { tabelas: {}, baseline: {} } } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "teto-"));
  temporarios.push(raiz);
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    const destino = path.join(raiz, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, conteudo);
  }
  const json = path.join(raiz, "allowlist.json");
  fs.writeFileSync(json, JSON.stringify(allowlist));
  return { raiz, json };
}

function run({ raiz, json }, ...extras) {
  return spawnSync(process.execPath, [SCRIPT, "--root", raiz, "--allowlist", json, ...extras], {
    encoding: "utf8",
    env: { PATH: "" },
  });
}

const SEM_TETO = 'const { data } = await supabase.from("entregas").select("*").order("created_at");\n';

// ------------------------------------------------------------------ cadeia
test("cadeia com .limit() inline passa", () => {
  const alvo = repo({ "src/a.tsx": 'await supabase.from("entregas").select("*").limit(500);\n' });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /0 nova/);
});

test("cadeia sem teto reprova com arquivo e linha", () => {
  const alvo = repo({ "src/hooks/x.tsx": `// cabeçalho\n${SEM_TETO}` });
  const r = run(alvo);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /src\/hooks\/x\.tsx:2/);
  assert.match(r.stderr, /entregas/);
});

test(".range(), .single() e .maybeSingle() contam como teto", () => {
  const alvo = repo({
    "src/a.tsx": [
      'await supabase.from("entregas").select("*").range(0, 49);',
      'await supabase.from("entregas").select("*").eq("id", 1).single();',
      'await supabase.from("entregas").select("*").eq("id", 1).maybeSingle();',
      "",
    ].join("\n"),
  });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("consulta só de contagem (head: true) não é listagem", () => {
  const alvo = repo({
    "src/a.tsx": 'await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", id);\n',
  });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("teto adiado na variável conta: await query.order(...).limit(100)", () => {
  const alvo = repo({
    "src/a.tsx": [
      'let query = supabase.from("entregas").select("*").is("deleted_at", null);',
      'if (so) query = query.gte("created_at", inicio);',
      "const { data } = await query",
      '  .order("created_at", { ascending: false })',
      "  .limit(100);",
      "",
    ].join("\n"),
  });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("teto adiado longe da consulta não conta", () => {
  const alvo = repo({
    "src/a.tsx": `let query = supabase.from("entregas").select("*");\n${"// padding\n".repeat(200)}query = query.limit(10);\n`,
  });
  const r = run(alvo);
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

test("select com ponto e vírgula dentro da string não corta a cadeia", () => {
  const alvo = repo({ "src/a.tsx": 'await supabase.from("entregas").select("id; nome").limit(50);\n' });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("Array.from() não é consulta", () => {
  const alvo = repo({ "src/a.tsx": "const xs = Array.from({ length: 3 }, (_, i) => i);\n" });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /0 consultas/);
});

test("arquivo de teste é ignorado", () => {
  const alvo = repo({
    "src/test/infra.test.ts": 'await supabase.from("tabela").select("*");\n',
    "src/ok.tsx": 'await supabase.from("entregas").select("*").limit(10);\n',
  });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /1 arquivos, 1 consultas/);
});

// ------------------------------------------------------------------ allowlist
test("tabela de domínio pequeno na allowlist não é dívida", () => {
  const alvo = repo(
    { "src/a.tsx": 'await supabase.from("permissions").select("*");\n' },
    { allowlist: { tabelas: { permissions: "catalogo fixo" }, baseline: {} } },
  );
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("allowlist de tabela não cobre outra tabela", () => {
  const alvo = repo(
    { "src/a.tsx": 'await supabase.from("entregas").select("*");\n' },
    { allowlist: { tabelas: { permissions: "catalogo fixo" }, baseline: {} } },
  );
  const r = run(alvo);
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

// ------------------------------------------------------------------ catraca
test("dívida congelada na mesma contagem passa", () => {
  const alvo = repo(
    { "src/a.tsx": SEM_TETO },
    { allowlist: { tabelas: {}, baseline: { "src/a.tsx:entregas": 1 } } },
  );
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("segunda cadeia sem teto no mesmo par arquivo:tabela reprova", () => {
  const alvo = repo(
    { "src/a.tsx": SEM_TETO + SEM_TETO },
    { allowlist: { tabelas: {}, baseline: { "src/a.tsx:entregas": 1 } } },
  );
  const r = run(alvo, "--json");
  assert.equal(r.status, 1, r.stdout + r.stderr);
  const relatorio = JSON.parse(r.stdout);
  assert.equal(relatorio.violations, 2);
  assert.equal(relatorio.debt, 1);
  assert.equal(relatorio.fresh.length, 2);
});

test("dívida que sumiu é reportada para apertar a catraca", () => {
  const alvo = repo(
    { "src/a.tsx": 'await supabase.from("entregas").select("*").limit(10);\n' },
    { allowlist: { tabelas: {}, baseline: { "src/a.tsx:entregas": 1 } } },
  );
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr, /já não aparecem/);
});

test("--update-baseline regrava o JSON e o ciclo seguinte passa", () => {
  const alvo = repo({ "src/a.tsx": SEM_TETO });
  const atualizado = run(alvo, "--update-baseline");
  assert.equal(atualizado.status, 0, atualizado.stdout + atualizado.stderr);
  const json = JSON.parse(fs.readFileSync(alvo.json, "utf8"));
  assert.deepEqual(json.baseline, { "src/a.tsx:entregas": 1 });
  const r = run(alvo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("--warn sai 0 mas avisa da dívida nova", () => {
  const alvo = repo({ "src/a.tsx": SEM_TETO });
  const r = run(alvo, "--warn");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr, /modo aviso/);
});

test("sem src/ o guard reprova em vez de dar verde falso", () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "teto-"));
  temporarios.push(raiz);
  const json = path.join(raiz, "allowlist.json");
  fs.writeFileSync(json, JSON.stringify({ tabelas: {}, baseline: {} }));
  const r = spawnSync(process.execPath, [SCRIPT, "--root", raiz, "--allowlist", json], {
    encoding: "utf8",
    env: { PATH: "" },
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /nothing was validated/);
});

test("--json devolve o relatório estruturado", () => {
  const alvo = repo({ "src/a.tsx": SEM_TETO });
  const r = run(alvo, "--json");
  assert.equal(r.status, 1);
  const relatorio = JSON.parse(r.stdout);
  assert.equal(relatorio.files, 1);
  assert.equal(relatorio.chains, 1);
  assert.equal(relatorio.violations, 1);
  assert.equal(relatorio.fresh[0].table, "entregas");
  assert.equal(relatorio.fresh[0].file, "src/a.tsx");
});

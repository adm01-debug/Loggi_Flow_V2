#!/usr/bin/env node
// Reprova cadeia de listagem sem teto: `supabase.from(<tabela>).select(...)` que não termina em
// `.limit(`, `.range(`, `.single(` ou `.maybeSingle(` (achado P-01 do plano QA).
// Node puro, sem dependência: o runner do CI não instala nada além do package.json.
//
// Modos:
//   node scripts/ci/validate-query-limits.mjs                 -> falha (saída 1) quando aparece dívida nova
//   node scripts/ci/validate-query-limits.mjs --warn           -> relatório igual, saída 0 (primeiro ciclo)
//   node scripts/ci/validate-query-limits.mjs --update-baseline -> regrava a dívida congelada no JSON
//   node scripts/ci/validate-query-limits.mjs --json           -> relatório em JSON (consumo por outro script)
//   --root <raiz do repositório> e --allowlist <arquivo> trocam o repositório varrido (o script lê
//   <raiz>/src) e a allowlist; é o que os testes usam com repositório sintético.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ALLOWLIST = resolve(SCRIPT_DIR, "query-limits.allowlist.json");
const SOURCE = /\.(?:ts|tsx)$/;
// Arquivo de teste não consulta tabela de produção: `src/test/testInfra.smoke.test.ts` usa
// `.from("tabela")` de mentira e viraria dívida falsa.
const TEST_FILE = /\.(?:test|spec)\.tsx?$|\.d\.ts$/;
// `.from(` de `Array.from`/`Buffer.from` não é consulta.
const NOT_A_QUERY = new Set(["Array", "Buffer", "Object", "String", "Uint8Array", "Int8Array", "Date"]);
// Fim de cadeia aceito. `.single()`/`.maybeSingle()` devolvem no máximo uma linha; `.csv()` e
// `.explain()` não são usados no repositório.
const CAPS = [".limit(", ".range(", ".single(", ".maybeSingle("];
// `select(<colunas>, { count: "exact", head: true })` pede so o numero de linhas: o servidor nao devolve
// dado nenhum, entao nao e listagem e nao precisa de teto.
const HEAD_ONLY = /head\s*:\s*true/;

const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const WARN = has("--warn");
const JSON_OUT = has("--json");
const UPDATE = has("--update-baseline");
const ROOT = resolve(flagValue("--root") ?? resolve(SCRIPT_DIR, "..", ".."), "src");
const ALLOWLIST_PATH = resolve(flagValue("--allowlist") ?? DEFAULT_ALLOWLIST);

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (SOURCE.test(entry.name) && !TEST_FILE.test(entry.name)) yield path;
  }
}

// Fim da instrução que contém a cadeia: `;` no nível zero, ignorando string, template (`${}` incluso)
// e comentário. Sem isso, `select("a; b")` cortaria a cadeia no meio e o `.limit()` do fim escaparia.
function chainEnd(text, start) {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i += 1;
      while (i < text.length) {
        if (text[i] === "\\") { i += 2; continue; }
        if (quote === "`" && text[i] === "$" && text[i + 1] === "{") {
          let inner = 1;
          i += 2;
          while (i < text.length && inner > 0) {
            if (text[i] === "\\") { i += 2; continue; }
            if (text[i] === "{") inner += 1;
            else if (text[i] === "}") inner -= 1;
            i += 1;
          }
          continue;
        }
        if (text[i] === quote) { i += 1; break; }
        i += 1;
      }
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      const nl = text.indexOf("\n", i);
      i = nl < 0 ? text.length : nl;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      const close = text.indexOf("*/", i + 2);
      i = close < 0 ? text.length : close + 2;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth += 1;
    else if (c === ")" || c === "]" || c === "}") depth -= 1;
    else if (c === ";" && depth === 0) return i;
    i += 1;
  }
  return text.length;
}

// Nome da variável que recebe a consulta (`let query = supabase.from(...)`), quando existe.
// É o que permite reconhecer o teto adiado: `query = query.limit(100)` depois dos filtros
// condicionais, padrão legítimo usado em useSecurityEvents.ts e useConciliacao.tsx.
function queryVariable(text, start) {
  const head = text.slice(Math.max(0, start - 400), start);
  const match = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*[A-Za-z_$.]*\s*$/.exec(head);
  return match ? match[1] : null;
}

// Teto adiado: a variável recebe a consulta e o teto entra depois, em outra instrução
// (`await query.order(...).limit(2000)` ou `query = query.limit(100)`). Procura o teto em qualquer
// cadeia encadeada na variável dentro de uma janela curta — análise sintática, não de escopo: um
// `.limit()` muito distante pertence a outro fluxo e não conta.
const DEFERRED_WINDOW = 2000;
function hasDeferredCap(text, variable, start) {
  if (!variable) return false;
  const fimJanela = Math.min(text.length, start + DEFERRED_WINDOW);
  const re = new RegExp(`\\b${variable.replace(/[$]/g, "\\$")}\\b`, "g");
  for (const match of text.slice(0, fimJanela).matchAll(re)) {
    if (match.index < start) continue;
    const depois = text.slice(match.index + variable.length, match.index + variable.length + 40);
    if (!/^\s*\./.test(depois)) continue;
    const end = chainEnd(text, match.index);
    if (CAPS.some((cap) => text.slice(match.index, end).includes(cap))) return true;
  }
  return false;
}

const allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));
const smallDomain = new Set(Object.keys(allowlist.tabelas ?? {}));
const baseline = { ...(allowlist.baseline ?? {}) };

const found = [];
let scanned = 0;
let chains = 0;
for (const path of walk(ROOT)) {
  const rel = relative(resolve(ROOT, ".."), path).split("\\").join("/");
  const text = readFileSync(path, "utf8");
  scanned += 1;
  for (const match of text.matchAll(/\.from\s*\(/g)) {
    const start = match.index;
    const receiverMatch = /([A-Za-z_$][\w$]*)?\s*$/.exec(text.slice(Math.max(0, start - 60), start));
    const receiver = receiverMatch?.[1];
    if (receiver && NOT_A_QUERY.has(receiver)) continue;
    const end = chainEnd(text, start);
    const chain = text.slice(start, end);
    if (!chain.includes(".select")) continue;
    chains += 1;
    if (CAPS.some((cap) => chain.includes(cap)) || HEAD_ONLY.test(chain)) continue;
    if (hasDeferredCap(text, queryVariable(text, start), end)) continue;
    const literal = /^\.from\s*\(\s*(['"])(.+?)\1/.exec(chain);
    const table = literal ? literal[2] : "<dinamica>";
    if (smallDomain.has(table)) continue;
    found.push({
      key: `${rel}:${table}`,
      table,
      file: rel,
      line: text.slice(0, start).split("\n").length,
      snippet: chain.replace(/\s+/g, " ").slice(0, 120),
    });
  }
}

if (scanned === 0) {
  console.error(`❌ src/ not found (${ROOT}) — nothing was validated.`);
  process.exit(1);
}

const counts = new Map();
for (const hit of found) counts.set(hit.key, (counts.get(hit.key) ?? 0) + 1);

const fresh = found.filter((hit) => (counts.get(hit.key) ?? 0) > (baseline[hit.key] ?? 0));
const stale = Object.keys(baseline).filter((key) => (counts.get(key) ?? 0) < baseline[key]);

if (UPDATE) {
  const next = { ...allowlist, baseline: Object.fromEntries([...counts].sort(([a], [b]) => (a < b ? -1 : 1))) };
  writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`✅ baseline atualizado: ${counts.size} pares arquivo:tabela (${found.length} cadeias sem teto).`);
  process.exit(0);
}

const report = {
  files: scanned,
  chains,
  violations: found.length,
  debt: counts.size,
  fresh: fresh.map(({ file, line, table, snippet }) => ({ file, line, table, snippet })),
  stale,
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const hit of fresh) {
    console.error(`❌ ${hit.file}:${hit.line} — from("${hit.table}") com .select() sem teto (nem na cadeia, nem depois na variável)`);
    console.error(`   ${hit.snippet}`);
  }
  if (fresh.length > 0) {
    console.error("\nAcrescente `.limit(<n>)` depois do `.order()` (ou `.range()` na paginação) e ordene antes de cortar.");
    console.error("Tabela de domínio pequeno, sem teto de propósito? Declare em scripts/ci/query-limits.allowlist.json > tabelas.");
  }
  if (stale.length > 0) {
    console.error(`\n♻️  ${stale.length} entrada(s) da dívida congelada já não aparecem — rode --update-baseline para apertar a catraca.`);
  }
  console.log(
    `${fresh.length > 0 ? "❌" : "✅"} Teto de listagem: ${scanned} arquivos, ${chains} consultas, ` +
      `${found.length} cadeias sem teto (dívida congelada ${counts.size}), ${fresh.length} nova(s)`,
  );
}

if (fresh.length > 0 && !WARN) process.exit(1);
if (fresh.length > 0) console.error("\n(modo aviso: saída 0 — a dívida nova não bloqueia esta PR)");

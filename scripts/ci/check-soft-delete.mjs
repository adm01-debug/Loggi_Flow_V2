#!/usr/bin/env node
// Reprova `.delete()` do front em tabela que tem exclusão lógica (achado D-02, etapa 058 do plano QA).
// docs/SOFT_DELETE_POLICY.md é política; aqui ela vira mecanismo: toda cadeia
// `supabase.from("<tabela>").delete()` em src/ cuja tabela tenha `deleted_at` reaprova a CI.
// A lista de tabelas é derivada de src/integrations/supabase/types.ts, não fixada: a próxima tabela que
// ganhar a coluna entra sozinha, sem editar este script.
//
// Escopo é src/ (front). supabase/functions/ fica de fora de propósito: edge function usa service_role e
// tem `.delete()` legítimo (limpeza, idempotência de webhook).
// Limite conhecido: só reconhece a chamada literal `.from("<tabela>")` na mesma cadeia; nome de tabela em
// variável ou query montada em duas etapas escapa — aí o ajuste é no padrão, nunca afrouxar o gate.
//
// Modos:
//   node scripts/ci/check-soft-delete.mjs        -> sai 1 quando encontra violação
//   node scripts/ci/check-soft-delete.mjs --json -> relatório em JSON
//   --root <raiz do repositório> troca o repositório varrido (é o que os testes usam)
import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const JSON_OUT = args.includes("--json");
const ROOT = resolve(flagValue("--root") ?? resolve(SCRIPT_DIR, "..", ".."));
const SRC = resolve(ROOT, "src");
const TYPES = resolve(SRC, "integrations", "supabase", "types.ts");

const SOURCE = /\.(?:ts|tsx)$/;
// Teste não escreve em tabela de produção: usa duplo de Supabase e o `.delete()` ali é do mock.
const TEST_FILE = /\.(?:test|spec)\.tsx?$|\.d\.ts$/;
// `.from(` de `Array.from`/`Buffer.from` não é consulta.
const NOT_A_QUERY = new Set(["Array", "Buffer", "Object", "String", "Uint8Array", "Int8Array", "Date"]);

// Tabelas com `deleted_at` na Row, lidas do arquivo gerado. Fica só na seção `Tables:`: `Views:` tem a
// mesma indentação e o mesmo nome de coluna, mas view não é tabela de escrita.
export function tablesWithSoftDelete(text) {
  const abertura = text.search(/^ {4}Tables: \{$/m);
  if (abertura < 0) return new Set();
  const corpo = text.slice(abertura + 1);
  const fecho = corpo.search(/^ {4}[A-Za-z]+: \{$/m);
  const secao = fecho < 0 ? corpo : corpo.slice(0, fecho);
  const blocos = [...secao.matchAll(/^ {6}([a-z0-9_]+): \{$/gm)];
  const tabelas = new Set();
  blocos.forEach((m, i) => {
    const fim = i + 1 < blocos.length ? blocos[i + 1].index : secao.length;
    // `deleted_at` é obrigatório na Row; no Insert é opcional e não define política.
    const row = secao.slice(m.index, fim).split(/\n\s+Insert: \{/)[0];
    if (/^\s+deleted_at\??: /m.test(row)) tabelas.add(m[1]);
  });
  return tabelas;
}

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

// Fim da instrução da cadeia: `;` no nível zero, ignorando string, template (`${}` incluso) e comentário.
// Sem isso, `select("a; b")` cortaria a cadeia no meio e o `.delete()` do fim escaparia.
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

const FROM = /\.from\(\s*["'`]([A-Za-z0-9_]+)["'`]\s*\)/g;
const DELETE = /\.delete\(\)/;

function main() {
  let tipos;
  try {
    tipos = readFileSync(TYPES, "utf8");
  } catch {
    console.error(
      `[soft-delete] ${relative(ROOT, TYPES) || TYPES} não encontrado: sem os tipos não dá para saber quais tabelas têm deleted_at.`,
    );
    return 2;
  }
  const tabelas = tablesWithSoftDelete(tipos);
  const violacoes = [];
  for (const arquivo of walk(SRC)) {
    const texto = readFileSync(arquivo, "utf8");
    if (!texto.includes(".delete()")) continue;
    for (const m of texto.matchAll(FROM)) {
      const tabela = m[1];
      if (NOT_A_QUERY.has(tabela) || !tabelas.has(tabela)) continue;
      const trecho = texto.slice(m.index, chainEnd(texto, m.index));
      if (!DELETE.test(trecho)) continue;
      violacoes.push({
        arquivo: relative(ROOT, arquivo),
        linha: texto.slice(0, m.index).split("\n").length,
        tabela,
      });
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ tabelasComDeletedAt: [...tabelas].sort(), violacoes }, null, 2));
  } else if (violacoes.length === 0) {
    console.log(`[soft-delete] OK: nenhum .delete() em tabela com deleted_at (${tabelas.size} tabelas verificadas).`);
  } else {
    console.error(`[soft-delete] ${violacoes.length} exclusão(ões) física(s) em tabela com exclusão lógica:`);
    for (const v of violacoes) console.error(`  ${v.arquivo}:${v.linha} — .from("${v.tabela}").delete()`);
    console.error(
      'Troque por .update({ deleted_at: new Date().toISOString() }) e filtre as leituras com .is("deleted_at", null); ver docs/SOFT_DELETE_POLICY.md.',
    );
  }
  return violacoes.length === 0 ? 0 : 1;
}

process.exitCode = main();

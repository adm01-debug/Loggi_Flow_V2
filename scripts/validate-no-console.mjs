#!/usr/bin/env node
// Fails CI when supabase/functions contains raw console.* calls.
// Prevents PII regressions in Edge Function logs.
// Node puro (sem ripgrep): o runner ubuntu-latest não tem `rg`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = "supabase/functions";
// Ancorado no script (como os outros gates), não no cwd: rodar de outra pasta não muda o alvo.
const ROOT_ABS = resolve(dirname(fileURLToPath(import.meta.url)), "..", ROOT);
// Qualquer acesso a membro de `console` — console.log/.table/.trace, console?.log, console["log"],
// com espaço ou quebra de linha no meio — e `console` usado como valor (`const { log } = console`,
// `fn(console)`): os dois caminhos levam dado cru para o log da function.
const PATTERN = /\bconsole\s*(?:\?\.|\.|\[)|[=(,:]\s*console\s*(?:[;,)}\]]|$)/gm;
const SOURCE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
// Mesma semântica dos globs antigos: exclui *.test.* (não *_test.ts),
// _shared/logger.ts e _shared/redis.ts.
const TEST_FILE = /\.test\.(?:[cm]?[jt]s|[jt]sx)$/;
const EXCLUDED = new Set(["_shared/logger.ts", "_shared/redis.ts"]);

function* walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (!SOURCE.test(entry.name)) continue;
    else if (entry.isFile() || (entry.isSymbolicLink() && statSync(path, { throwIfNoEntry: false })?.isFile())) yield path;
  }
}

if (!statSync(ROOT_ABS, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`❌ ${ROOT} not found (${ROOT_ABS}) — nothing was validated.`);
  process.exit(1);
}

const hits = [];
let scanned = 0;
for (const path of walk(ROOT_ABS)) {
  // O antigo replace(`${ROOT}/`) nunca casava no Windows (path.join usa `\`),
  // deixando _shared/logger.ts etc. fora da exclusão (falso positivo).
  // relative() normaliza caminho independente do OS, mas no Windows devolve
  // separador `\`; o Set EXCLUDED usa `/`, então normaliza para forward-slash.
  const rel = relative(ROOT_ABS, path).split("\\").join("/");
  if (TEST_FILE.test(rel) || EXCLUDED.has(rel)) continue;
  scanned += 1;
  // Casa no arquivo inteiro (não linha a linha) para pegar `console\n  .log(...)`.
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const seen = new Set();
  for (const match of content.matchAll(PATTERN)) {
    const lineNo = content.slice(0, match.index + match[0].indexOf("console")).split("\n").length;
    if (seen.has(lineNo)) continue;
    seen.add(lineNo);
    hits.push(`${ROOT}/${rel}:${lineNo}:${lines[lineNo - 1].trim()}`);
  }
}

// Zero arquivos lidos = checkout parcial ou estrutura mudou; "nenhum console" seria falso verde.
if (scanned === 0) {
  console.error(`❌ No source files found under ${ROOT} — nothing was validated.`);
  process.exit(1);
}

if (hits.length > 0) {
  console.error("❌ Raw console.* calls detected in supabase/functions:");
  console.error(hits.join("\n"));
  console.error("\nUse `log.info / log.warn / log.error` from _shared/logger.ts");
  process.exit(1);
}
console.log(`✅ No raw console.* calls in supabase/functions (${scanned} files)`);

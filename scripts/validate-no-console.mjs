#!/usr/bin/env node
// Fails CI when supabase/functions contains raw console.* calls.
// Prevents PII regressions in Edge Function logs.
// Node puro (sem ripgrep): o runner ubuntu-latest não tem `rg`.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "supabase/functions";
const PATTERN = /console\.(log|info|warn|error|debug)/;
// Mesma semântica dos globs antigos: exclui *.test.ts (não *_test.ts),
// _shared/logger.ts e _shared/redis.ts.
const EXCLUDED = new Set(["_shared/logger.ts", "_shared/redis.ts"]);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile() && entry.name.endsWith(".ts")) yield path;
  }
}

const hits = [];
for (const path of walk(ROOT)) {
  // O antigo replace(`${ROOT}/`) nunca casava no Windows (path.join usa `\`),
  // deixando _shared/logger.ts etc. fora da exclusão (falso positivo).
  // relative() normaliza caminho independente do OS, mas no Windows devolve
  // separador `\`; o Set EXCLUDED usa `/`, então normaliza para forward-slash.
  const rel = relative(ROOT, path).split("\\").join("/");
  if (rel.endsWith(".test.ts") || EXCLUDED.has(rel)) continue;
  const lines = readFileSync(path, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (PATTERN.test(line)) hits.push(`${path}:${i + 1}:${line.trim()}`);
  });
}

if (hits.length > 0) {
  console.error("❌ Raw console.* calls detected in supabase/functions:");
  console.error(hits.join("\n"));
  console.error("\nUse `log.info / log.warn / log.error` from _shared/logger.ts");
  process.exit(1);
}
console.log("✅ No raw console.* calls in supabase/functions");

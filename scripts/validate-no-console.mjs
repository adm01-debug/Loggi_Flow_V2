#!/usr/bin/env node
// Fails CI when supabase/functions contains raw console.* calls.
// Prevents PII regressions in Edge Function logs.
import { execSync } from "node:child_process";

const CMD =
  "rg -n \"console\\.(log|info|warn|error|debug)\" supabase/functions " +
  "--glob '!**/*.test.ts' --glob '!**/_shared/logger.ts' --glob '!**/_shared/redis.ts'";


let output = "";
try {
  output = execSync(CMD, { encoding: "utf8" });
} catch (err) {
  // rg exits non-zero when no matches — that's the success case.
  if (err.status === 1) {
    console.log("✅ No raw console.* calls in supabase/functions");
    process.exit(0);
  }
  throw err;
}

if (output.trim()) {
  console.error("❌ Raw console.* calls detected in supabase/functions:");
  console.error(output);
  console.error("\nUse `log.info / log.warn / log.error` from _shared/logger.ts");
  process.exit(1);
}
console.log("✅ No raw console.* calls in supabase/functions");

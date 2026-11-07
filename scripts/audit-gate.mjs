// Gate de vulnerabilidades: falha em qualquer CRITICAL/HIGH fora da allowlist.
// Allowlist só para pacotes SEM fix disponível no npm, com justificativa e revisão
// a cada sprint. Remova a entrada assim que houver fix (npm audit volta a cobrar).
import { execSync } from "node:child_process";

// xlsx (SheetJS) saiu do registro npm; 0.18.5 é a última publicada e carrega
// CVEs de prototype pollution/ReDoS sem fix instalável via npm.
// Alternativa futura: tarball oficial https://cdn.sheetjs.com (decisão de deploy).
// vite 5.4.x: CVEs exclusivas do DEV SERVER (path traversal em .map, fs.deny no
// Windows, launch-editor NTLM) — não afetam o bundle de produção; fix exige o
// major vite 8 (upgrade dedicado com validação de plugin-pwa/swc/Lovable).
const ALLOWLIST = new Set(["xlsx", "vite"]);

let raw;
try {
  raw = execSync("npm audit --json", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (err) {
  raw = err.stdout; // npm audit sai com código != 0 quando há vulnerabilidades
}

// npm audit com rede/registro indisponível pode emitir JSON com campo `error`
// (sem `vulnerabilities`) ou saída não-JSON. Nos dois casos o audit não rodou:
// falhar é o comportamento seguro — um gate que passa sem validar é pior que
// um gate que derruba o build por tooling quebrado.
let report;
try {
  report = JSON.parse(raw);
} catch (err) {
  console.error("❌ npm audit não produziu JSON (rede/registro indisponível?).");
  console.error(`  ${err.message}`);
  process.exit(1);
}
if (report.error) {
  console.error("❌ npm audit reportou erro na execução:");
  console.error(`  ${[report.error.code, report.error.summary].filter(Boolean).join(" ")}`);
  process.exit(1);
}

const offenders = Object.values(report.vulnerabilities ?? {}).filter(
  (v) => ["critical", "high"].includes(v.severity) && !ALLOWLIST.has(v.name),
);

if (offenders.length > 0) {
  console.error("❌ Vulnerabilidades critical/high fora da allowlist:");
  for (const v of offenders) console.error(`  - ${v.name} (${v.severity})`);
  process.exit(1);
}
const ignored = Object.values(report.vulnerabilities ?? {}).filter(
  (v) => ["critical", "high"].includes(v.severity) && ALLOWLIST.has(v.name),
);
console.log(
  `✅ Sem critical/high fora da allowlist${ignored.length ? ` (allowlist ativa: ${[...new Set(ignored.map((v) => v.name))].join(", ")})` : ""}`,
);

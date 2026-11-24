// Gate de vulnerabilidades: falha em qualquer CRITICAL/HIGH fora da allowlist.
// Allowlist só para pacotes SEM fix disponível no npm, com justificativa e revisão
// a cada sprint. Remova a entrada assim que houver fix (npm audit volta a cobrar).
import { execSync } from "node:child_process";

// Histórico da isenção — VAZIA desde 2026-11-24 (etapa 270): `npm audit --json` devolve zero em
// todas as severidades e as três entradas perdoavam advisory que já não existe. Os comentários
// ficam porque, se o advisory voltar, reintroduzir a entrada é uma linha — e reconstruir a análise
// custa caro. Antes de reintroduzir, confirme com `npm audit --json` que ele voltou.
//   xlsx (SheetJS): saiu do registro npm; 0.18.5 era a última publicada e carregava CVEs de
//   prototype pollution/ReDoS sem fix instalável. Alternativa futura: tarball oficial
//   https://cdn.sheetjs.com (decisão de deploy). Hoje o pacote instalado é outro — `xlsx-js-style`
//   (alias `npm:xlsx-js-style@1.2.0` em package.json) —, então o advisory não o alcança mais.
//   vite: CVEs exclusivas do DEV SERVER da linha 5.4.x (path traversal em .map, fs.deny no Windows,
//   launch-editor NTLM) — nunca afetaram o bundle de produção; o projeto subiu para vite 6.4.6.
//   picomatch: GHSA-fc5q-39xc-vjpf (ReDoS em extglob, `<= 4.0.7`) foi RETIRADO a montante em
//   2026-11-18 — não existe 4.0.8 e 4.0.7 é a última publicada. Atingia só o grafo de build/teste
//   (vite, vitest, tailwind, lint-staged, workbox) com padrões do próprio repo, nunca entrada de
//   usuário.
//   Revisão 2026-11-17: subir para vite 8 NÃO apagava o advisory do picomatch — lint-staged,
//   tinyglobby, @rollup/pluginutils, vitest e a cadeia micromatch/anymatch/readdirp puxam
//   picomatch por conta própria.
const ALLOWLIST = new Set([]);

// Registry pendurado não pode segurar o job até o timeout do runner (6h).
const AUDIT_TIMEOUT_MS = Number(process.env.AUDIT_TIMEOUT_MS) || 5 * 60 * 1000;

let raw;
let execError;
try {
  raw = execSync("npm audit --json", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: AUDIT_TIMEOUT_MS });
} catch (err) {
  raw = err.stdout; // npm audit sai com código != 0 quando há vulnerabilidades
  execError = err;
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
  if (execError?.code === "ETIMEDOUT") {
    console.error(`  npm audit não respondeu em ${AUDIT_TIMEOUT_MS / 1000}s e foi interrompido.`);
  }
  process.exit(1);
}
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
// O npm 10 devolve o motivo real (ECONNREFUSED, 503...) em `message`, com `error.summary` vazio.
if (report?.error) {
  console.error("❌ npm audit reportou erro na execução:");
  console.error(`  ${[report.error.code, report.error.summary, report.message].filter(Boolean).join(" ")}`);
  process.exit(1);
}
// JSON válido sem o mapa `vulnerabilities` (corpo de erro do registry, formato `advisories` do
// npm 6, `{}`) também é audit que não rodou: sem esta checagem o gate passava com zero achados.
if (!isPlainObject(report) || !isPlainObject(report.vulnerabilities)) {
  console.error("❌ npm audit devolveu JSON sem o mapa `vulnerabilities` (formato inesperado: exige npm >= 7 e resposta válida do registry).");
  if (report?.message) console.error(`  ${report.message}`);
  process.exit(1);
}

// Um pacote só aparece no audit porque algum advisory o alcança. Allowlistar
// apenas o nome direto não bastava: o advisory de picomatch marcou 31 pacotes
// que só o carregam transitivamente. Resolve-se a cadeia `via` até os pacotes
// que de fato têm advisory; se todos estiverem na allowlist, a entrada é
// coberta. Qualquer raiz nova fora da allowlist volta a derrubar o gate.
const rootsOf = (vuln) => {
  const roots = new Set();
  const seen = new Set();
  const stack = [vuln];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur || seen.has(cur.name)) continue;
    seen.add(cur.name);
    for (const via of cur.via ?? []) {
      if (typeof via === "string") {
        const parent = report.vulnerabilities[via];
        if (parent) stack.push(parent);
      } else if (via?.name && ["critical", "high"].includes(via.severity)) {
        roots.add(via.name);
      }
    }
  }
  return roots;
};

const isCovered = (vuln) => {
  if (ALLOWLIST.has(vuln.name)) return true;
  const roots = [...rootsOf(vuln)];
  return roots.length > 0 && roots.every((r) => ALLOWLIST.has(r));
};

// Quais entradas da allowlist justificam esta vulnerabilidade (direta ou transitiva).
const coveringRoots = (vuln) => {
  const roots = [...rootsOf(vuln)].filter((r) => ALLOWLIST.has(r));
  if (ALLOWLIST.has(vuln.name)) roots.push(vuln.name);
  return roots;
};

const offenders = Object.values(report.vulnerabilities).filter(
  (v) => ["critical", "high"].includes(v.severity) && !isCovered(v),
);

if (offenders.length > 0) {
  console.error("❌ Vulnerabilidades critical/high fora da allowlist:");
  for (const v of offenders) console.error(`  - ${v.name} (${v.severity})`);
  process.exit(1);
}
const ignored = Object.values(report.vulnerabilities).filter(
  (v) => ["critical", "high"].includes(v.severity) && isCovered(v),
);
const activeRoots = new Set(ignored.flatMap((v) => coveringRoots(v)));
console.log(
  `✅ Sem critical/high fora da allowlist${activeRoots.size ? ` (allowlist ativa: ${[...activeRoots].join(", ")})` : ""}`,
);
// Entrada que não cobre mais nada é só risco: a próxima vulnerabilidade do pacote passaria calada.
const stale = [...ALLOWLIST].filter((name) => !activeRoots.has(name));
if (stale.length > 0) {
  console.error(`⚠️  Allowlist sem efeito para: ${stale.join(", ")} — remova a entrada em scripts/audit-gate.mjs.`);
}

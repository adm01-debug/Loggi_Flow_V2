import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const JSON_OUT = args.includes("--json");
const ROOT = path.resolve(
  flagValue("--root") ?? path.resolve(SCRIPT_DIR, "..", ".."),
);

// Etapa 255 (achado H-03): `Agents Docs Integrity` confere se o arquivo existe e nao encolheu, nao se o
// que ele afirma e verdade. Estas tres conferencias sao locais, sem rede e sem token: o numero de
// required checks vem do baseline versionado, que o `settings-guard.yml` mantem fiel ao GitHub.

export function requiredChecksDoBaseline(root) {
  const arquivo = path.join(
    root,
    "scripts",
    "ci",
    "github-settings-baseline.json",
  );
  const baseline = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  return baseline?.branch_protection_main?.required_status_checks ?? [];
}

export function migrationsNoDisco(root) {
  const pasta = path.join(root, "supabase", "migrations");
  if (!fs.existsSync(pasta)) return 0;
  return fs.readdirSync(pasta).filter((nome) => nome.endsWith(".sql")).length;
}

export function workflowsCitados(texto) {
  const nomes = [
    ...texto.matchAll(/\.github\/workflows\/([A-Za-z0-9._-]+\.ya?ml)/g),
  ].map((m) => m[1]);
  return [...new Set(nomes)];
}

function conferirRequiredChecks(texto, baseline) {
  const citado = texto.match(/os (\d+) required checks/);
  if (!citado) {
    return [
      'AGENTS.md nao afirma mais "os N required checks": a frase que o gate confere foi reescrita ou removida.',
    ];
  }
  const numero = Number(citado[1]);
  if (numero === baseline.length) return [];
  return [
    `AGENTS.md diz "os ${numero} required checks", mas scripts/ci/github-settings-baseline.json lista ${baseline.length}: ${baseline.join(", ")}.`,
  ];
}

function conferirMigrations(texto, noDisco) {
  const citado = texto.match(/hoje \*\*(\d+)\*\* em (\d{4}-\d{2}-\d{2})/);
  if (!citado) {
    return [
      'AGENTS.md nao afirma mais a contagem de migrations ("hoje **N** em AAAA-MM-DD").',
    ];
  }
  const numero = Number(citado[1]);
  if (numero === noDisco) return [];
  return [
    `AGENTS.md diz ${numero} migrations (medido em ${citado[2]}), e ha ${noDisco} arquivos .sql em supabase/migrations: atualize o numero e a data.`,
  ];
}

function conferirWorkflows(texto, root) {
  const erros = [];
  for (const nome of workflowsCitados(texto)) {
    if (fs.existsSync(path.join(root, ".github", "workflows", nome))) continue;
    erros.push(`AGENTS.md cita .github/workflows/${nome}, que nao existe.`);
  }
  return erros;
}

export function main() {
  const arquivo = path.join(ROOT, "AGENTS.md");
  if (!fs.existsSync(arquivo)) {
    console.error("[agents-facts] AGENTS.md nao encontrado.");
    return 1;
  }
  const texto = fs.readFileSync(arquivo, "utf8");
  const baseline = requiredChecksDoBaseline(ROOT);
  const migrations = migrationsNoDisco(ROOT);

  const erros = [
    ...conferirRequiredChecks(texto, baseline),
    ...conferirMigrations(texto, migrations),
    ...conferirWorkflows(texto, ROOT),
  ];

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        {
          requiredChecksNoBaseline: baseline.length,
          migrationsNoDisco: migrations,
          erros,
        },
        null,
        2,
      ),
    );
  } else if (erros.length === 0) {
    console.log(
      `[agents-facts] OK: ${baseline.length} required checks e ${migrations} migrations batem com o AGENTS.md; todo workflow citado existe.`,
    );
  } else {
    console.error(
      `[agents-facts] ${erros.length} afirmacao(oes) do AGENTS.md sem suporte no repo:`,
    );
    for (const erro of erros) console.error(`  ${erro}`);
    console.error(
      "Corrija o texto do AGENTS.md (ou o baseline) e rode de novo: docs/qa/04-PLANO.md, etapa 255.",
    );
  }
  return erros.length === 0 ? 0 : 1;
}

process.exitCode = main();

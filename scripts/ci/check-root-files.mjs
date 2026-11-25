import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
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

// Etapa 273: a raiz so carrega configuracao legitima. Backup, dump, binario ou patch solto reprova.
// Arquivo novo de verdade entra aqui de forma consciente - o gate existe para a lista ser revisada.
export const PERMITIDOS = new Set([
  ".commitlintrc.json",
  ".env.example",
  ".gitattributes",
  ".gitignore",
  ".gitleaks.toml",
  ".graphifyignore",
  ".hermes.md",
  ".lintstagedrc.json",
  ".prettierignore",
  ".size-limit.json",
  ".warning-budget.json",
  "AGENTS.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "DOCUMENTATION.md",
  "ESTADO_ATUAL.md",
  "ESTADO_ATUAL_EVIDENCIAS.md",
  "LICENSE",
  "README.md",
  "TEMPLATE_STRUCTURE.md",
  "ai-context.config.json",
  "bun.lock",
  "bun.lockb",
  "components.json",
  "eslint.config.js",
  "graphify.local.json",
  "index.html",
  "package-lock.json",
  "package.json",
  "playwright.config.ts",
  "postcss.config.js",
  "tailwind.config.ts",
  "tsconfig.app.json",
  "tsconfig.json",
  "tsconfig.node.json",
  "vercel.json",
  "vite.config.ts",
  "vitest.config.ts",
]);

// O que entra no repositorio e o que interessa: `git ls-files` ignora build, coverage e node_modules
// sem precisar repetir padrao de .gitignore aqui.
export function arquivosDaRaiz(root) {
  try {
    const saida = execFileSync(
      "git",
      ["-C", root, "ls-files", "--cached", "-z"],
      {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    return saida
      .split("\0")
      .filter((arquivo) => arquivo.length > 0 && !arquivo.includes("/"));
  } catch {
    return fs.readdirSync(root).filter((nome) => {
      try {
        return fs.statSync(path.join(root, nome)).isFile();
      } catch {
        return false;
      }
    });
  }
}

export function main() {
  const raiz = arquivosDaRaiz(ROOT).sort();
  const naoDeclarados = raiz.filter((arquivo) => !PERMITIDOS.has(arquivo));

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: raiz.length, naoDeclarados }, null, 2));
  } else if (naoDeclarados.length === 0) {
    console.log(
      `[root-files] OK: ${raiz.length} arquivos na raiz, todos declarados.`,
    );
  } else {
    console.error(
      `[root-files] ${naoDeclarados.length} arquivo(s) nao declarado(s) na raiz:`,
    );
    for (const arquivo of naoDeclarados) console.error(`  ${arquivo}`);
    console.error(
      "Remova o arquivo do repositorio ou, se for configuracao legitima, acrescente-o a PERMITIDOS em scripts/ci/check-root-files.mjs (docs/qa/04-PLANO.md, etapa 273).",
    );
  }
  return naoDeclarados.length === 0 ? 0 : 1;
}

process.exitCode = main();

#!/usr/bin/env node
/**
 * Impede que o `.env` volte para o indice do git (etapa 018 do plano QA, achado S-07).
 * O gitleaks procura *padrao de segredo* no diff: um `.env` com a chave `anon` passa limpo — foi assim
 * que o arquivo ficou meses no repositorio. Este gate olha o **nome** do arquivo: reprova qualquer
 * caminho rastreado (`git ls-files`) cujo nome comece com `.env` e nao seja `.env.example`.
 * Olha o indice, nao o disco: `.env` na maquina do dev, ignorado pelo git, nao reprova.
 * Sai 0 quando limpo, 1 quando ha arquivo de ambiente rastreado (uma linha `::error::` por caminho) e
 * 2 quando nao conseguiu ler o indice (fora de um repositorio git, `git` fora do PATH) — falha do
 * proprio gate, como no typecheck-ratchet.
 * Sem dependencia externa. No CI roda no job `Security Scan` do `.github/workflows/ci.yml`.
 */
import { execFileSync } from "node:child_process";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

const PERMITIDOS = new Set([".env.example"]);

// Raiz padrao: o repositorio em que este script esta, qualquer que seja o cwd. `--root` existe para o
// teste rodar contra um repositorio sintetico.
function raiz(argv) {
  const i = argv.indexOf("--root");
  if (i === -1) return fileURLToPath(new URL("../..", import.meta.url));
  const valor = argv[i + 1];
  if (!valor) {
    console.error("::error::--root exige um caminho.");
    process.exit(2);
  }
  return valor;
}

const ROOT = raiz(process.argv.slice(2));

let lista;
try {
  lista = execFileSync("git", ["-C", ROOT, "ls-files", "-z"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
} catch (erro) {
  console.error(
    `::error::Nao foi possivel ler o indice do git em ${ROOT}: ${erro.message}. Fora de um repositorio git o gate nao tem o que vigiar — verifique o checkout.`,
  );
  process.exit(2);
}

const rastreados = lista.split("\0").filter(Boolean);
const proibidos = rastreados.filter((caminho) => {
  const nome = basename(caminho);
  return /^\.env(\.|$)/.test(nome) && !PERMITIDOS.has(nome);
});

if (proibidos.length > 0) {
  for (const caminho of proibidos) {
    console.error(
      `::error::${caminho} esta rastreado pelo git. Arquivo de ambiente nao entra no repositorio (achado S-07). Tire do indice com \`git rm --cached "${caminho}"\`, confirme o .gitignore e mantenha so o .env.example.`,
    );
  }
  process.exitCode = 1;
  process.exit();
}

console.log(
  `OK: nenhum arquivo de ambiente rastreado (${rastreados.length} caminhos conferidos; permitido apenas ${[...PERMITIDOS].join(", ")}).`,
);

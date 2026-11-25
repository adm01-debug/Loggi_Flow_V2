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

// Documentos que um agente le antes de tocar no codigo (etapa 248).
export function documentos(root) {
  const pasta = path.join(root, "docs", "agentes");
  const daPasta = fs.existsSync(pasta)
    ? fs
        .readdirSync(pasta)
        .filter((nome) => nome.endsWith(".md"))
        .map((nome) => `docs/agentes/${nome}`)
    : [];
  return ["AGENTS.md", "DOCUMENTATION.md", ...daPasta].filter((rel) =>
    fs.existsSync(path.join(root, rel)),
  );
}

// Isencao explicita na propria linha: caminho removido ou que ainda sera criado.
const ISENCAO = /n[aã]o existe/i;
const CITACAO = /`([^`]+)`/g;
const PREFIXOS = ["src/", "supabase/", "scripts/"];
// Placeholder, glob e caminho com espaco nao sao caminho literal.
const NAO_LITERAL = /[*?<>{}|]|\.\.\.|\s/;

// `src/App.tsx:153` e `src/App.tsx:153-160` apontam para o arquivo, nao para um nome com dois-pontos.
export function normalizar(citado) {
  return citado
    .replace(/^\.\//, "")
    .replace(/:\d+(?:-\d+)?$/, "")
    .replace(/[;,)]+$/, "");
}

export function violacoesDeTexto(rel, texto, root) {
  const violacoes = [];
  texto.split(/\r?\n/).forEach((linha, indice) => {
    if (ISENCAO.test(linha)) return;
    for (const achado of linha.matchAll(CITACAO)) {
      const citado = achado[1].trim();
      const alvo = normalizar(citado);
      if (!PREFIXOS.some((prefixo) => alvo.startsWith(prefixo))) continue;
      if (NAO_LITERAL.test(citado)) continue;
      if (fs.existsSync(path.join(root, alvo))) continue;
      violacoes.push({ arquivo: rel, linha: indice + 1, citado, alvo });
    }
  });
  return violacoes;
}

export function main() {
  const lidos = documentos(ROOT);
  const violacoes = lidos.flatMap((rel) =>
    violacoesDeTexto(rel, fs.readFileSync(path.join(ROOT, rel), "utf8"), ROOT),
  );

  if (JSON_OUT) {
    console.log(JSON.stringify({ documentos: lidos, violacoes }, null, 2));
  } else if (violacoes.length === 0) {
    console.log(
      `[doc-paths] OK: todo caminho citado nos ${lidos.length} documentos de agente existe em disco.`,
    );
  } else {
    console.error(
      `[doc-paths] ${violacoes.length} caminho(s) citado(s) sem arquivo em disco:`,
    );
    for (const v of violacoes)
      console.error(`  ${v.arquivo}:${v.linha} cita "${v.citado}"`);
    console.error(
      'Corrija para o caminho real ou escreva "nao existe" na mesma linha quando a citacao for proposital (docs/qa/04-PLANO.md, etapa 248).',
    );
  }
  return violacoes.length === 0 ? 0 : 1;
}

process.exitCode = main();

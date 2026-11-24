#!/usr/bin/env node
/**
 * Etapa 142 do plano QA (achado B-02): chave de dedupe nao pode conter valor aleatorio ou relogio.
 * O defeito original: `crypto.randomUUID()` ou `Date.now()` dentro da chave do evento faz cada
 * entrega repetida parecer evento novo — a dedupe nunca casa e o webhook reprocessa.
 * Alvo: `supabase/functions/**\/index.ts`.
 *
 * O que conta como violacao: um nome que contenha `event_id`/`eventId`/`event_key`/`idempot*`
 * seguido de `:` ou `=` e, na mesma expressao (ate o `;` ou 300 caracteres), uma chamada a
 * `crypto.randomUUID(` ou `Date.now(`.
 *
 * O que NAO conta: `Date.now()` com outro nome (`startedAt`, `expiresAt`, `timestamp`) e
 * `crypto.randomUUID()` fora de chave (o `Request-ID` de `lalamove-tracking`) — proibir a chamada no
 * repositorio inteiro viraria ruido e alguem desligaria o gate. Comentarios sao mascarados antes da
 * busca, para um `// antes era Date.now()` nao reprovar codigo limpo.
 *
 * Sai 0 quando limpo, 1 quando ha violacao (uma linha `::error::` por ocorrencia) e 2 em uso invalido.
 * Sem dependencia externa. `--root` existe para o teste rodar contra um repositorio sintetico.
 * Ainda NAO esta ligado a workflow: a etapa 142 proibe mexer na CI — a sugestao esta registrada em
 * `docs/qa/05-PROGRESSO.md`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ALVO = "supabase/functions";
const NOME = "index.ts";
// Ate o fim da expressao: `;` encerra; 300 caracteres cobrem atribuicao multi-linha sem alcancar
// a declaracao seguinte.
const PADRAO = /(event_?id|event_?key|idempot[a-z0-9_]*)\s*[:=][^;]{0,300}?(?:crypto\s*\.\s*randomUUID|Date\s*\.\s*now)\s*\(/gi;

function raiz(argv) {
  const i = argv.indexOf("--root");
  if (i === -1) return resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const valor = argv[i + 1];
  if (!valor || valor.startsWith("--")) {
    console.error("::error::--root exige um caminho.");
    process.exit(2);
  }
  return resolve(valor);
}

function* caminhar(dir) {
  const entradas = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) yield* caminhar(caminho);
    else if (entrada.isFile() && entrada.name === NOME) yield caminho;
  }
}

// Mascara comentarios mantendo o tamanho e as quebras de linha: o numero de linha continua exato.
function semComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (linha) => " ".repeat(linha.length));
}

const ROOT = raiz(process.argv.slice(2));
const ALVO_ABS = join(ROOT, ALVO);

if (!statSync(ALVO_ABS, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`::error::${ALVO} nao encontrado em ${ROOT} — nada foi validado.`);
  process.exit(2);
}

let arquivos = 0;
const violacoes = [];
for (const caminho of caminhar(ALVO_ABS)) {
  arquivos += 1;
  const mascara = semComentarios(readFileSync(caminho, "utf8"));
  const linhas = mascara.split("\n");
  const vistos = new Set();
  for (const achado of mascara.matchAll(PADRAO)) {
    const linha = mascara.slice(0, achado.index).split("\n").length;
    if (vistos.has(linha)) continue;
    vistos.add(linha);
    violacoes.push(`${ALVO}/${relative(ALVO_ABS, caminho).split("\\").join("/")}:${linha}: ${linhas[linha - 1].trim()}`);
  }
}

if (arquivos === 0) {
  console.error(`::error::Nenhum ${NOME} encontrado sob ${ALVO} — nada foi validado (checkout parcial?).`);
  process.exit(2);
}

if (violacoes.length > 0) {
  console.error("::error::Chave de dedupe construida com valor aleatorio ou relogio:");
  console.error(violacoes.join("\n"));
  console.error("Use campo estavel do evento (id do provedor, hash do corpo) — ver supabase/functions/_shared/idempotency.ts.");
  process.exit(1);
}

console.log(`OK: ${arquivos} arquivos ${NOME} conferidos; nenhuma chave com crypto.randomUUID() ou Date.now().`);

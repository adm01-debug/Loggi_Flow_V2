import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = join(process.cwd(), "src/hooks/logistics/useCotacoesMulticanal.tsx");
const src = readFileSync(HOOK, "utf8");
const TELA = readFileSync(join(process.cwd(), "src/pages/DashboardCotacoes.tsx"), "utf8");

/** Acessos que nao sao coluna: metodos e propriedades de JS. */
const NAO_COLUNA = new Set(["toFixed", "length", "push", "map", "filter", "slice"]);

/** Colunas que a etapa 210 removeu do select de listagem por nao serem lidas na tela. */
const DESCARTADAS = [
  "user_id",
  "transportadora_id",
  "origem_cidade",
  "destino_cidade",
  "peso_kg",
  "volumes",
  "valor_mercadoria",
  "observacoes",
  "responded_at",
  "created_at",
  "updated_at",
];

/** Campos de uma cotacao realmente lidos na tela: `cotacao.x`, `c.x` e `selectedCotacao.x`. */
function camposLidos(): string[] {
  const nomes = [...TELA.matchAll(/\b(cotacao|selectedCotacao|c)\.(\w+)/g)].map((m) => m[2]);
  return [...new Set(nomes)].filter((n) => !NAO_COLUNA.has(n)).sort();
}

/** As colunas escritas explicitamente no select de listagem (sem o join da transportadora). */
function colunasDoSelect(): string[] {
  const inicio = listagem().indexOf(".select(");
  expect(inicio).toBeGreaterThan(-1);
  const corpo = listagem().slice(inicio + ".select(".length, listagem().indexOf("transportadora:", inicio));
  return [...new Set(
    corpo
      .split(",")
      .map((token) => token.replace(/[^a-z_]/gi, ""))
      .filter((token) => /^[a-z_]+$/i.test(token)),
  )].sort();
}

/** A cadeia da consulta de listagem, do `.from("cotacoes_multicanal")` ate o `;`. */
function listagem(): string {
  const inicio = src.indexOf('.from("cotacoes_multicanal")');
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf(";", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim + 1);
}

describe("useCotacoesMulticanal: teto e colunas explicitas (etapa 210, P-01/P-04)", () => {
  it("limita a listagem no servidor, depois de ordenar", () => {
    const q = listagem();
    expect(q).toContain(".limit(200);");
    expect(q).toContain('.order("created_at", { ascending: false })');
    expect(q.indexOf(".order(")).toBeLessThan(q.indexOf(".limit(200)"));
  });

  it("nao usa select('*') na listagem", () => {
    expect(listagem()).not.toContain("*");
  });

  it("traz exatamente as colunas que a tela le, nem mais nem menos", () => {
    const lidos = camposLidos().filter((campo) => campo !== "transportadora");
    // guarda contra o teste passar por vacuidade se o extrator quebrar
    expect(lidos.length).toBeGreaterThan(5);
    expect(colunasDoSelect()).toEqual(lidos);
  });

  it("confirma que as colunas descartadas nao sao lidas na tela", () => {
    const lidos = camposLidos();
    const aindaLidas = DESCARTADAS.filter((campo) => lidos.includes(campo));
    expect(aindaLidas).toEqual([]);
  });

  it("mantem o polling de 30s e o join da transportadora", () => {
    expect(src).toContain("refetchInterval: 30000");
    expect(listagem()).toContain("transportadora:transportadoras");
    expect(listagem()).toContain("nome_fantasia");
  });

  it("nao mexe nas mutacoes nem nos filtros derivados", () => {
    expect(src).toContain("const createCotacao = useMutation({");
    expect(src).toContain("const updateCotacao = useMutation({");
    expect(src).toContain("const selectCotacao = useMutation({");
    expect(src).toContain('c.status === "expirado"');
  });
});

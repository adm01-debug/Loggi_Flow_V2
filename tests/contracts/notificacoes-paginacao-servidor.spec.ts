import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = readFileSync(
  join(process.cwd(), "src/hooks/data/useNotificacoesPage.ts"),
  "utf8",
);
const TELA = readFileSync(join(process.cwd(), "src/pages/Notificacoes.tsx"), "utf8");

/** A cadeia da consulta de pagina: do `.from("notifications")` ate o `;`. */
function pagina(): string {
  const inicio = HOOK.indexOf('.from("notifications")');
  expect(inicio).toBeGreaterThan(-1);
  const fim = HOOK.indexOf(";", HOOK.indexOf(".range(from, to)", inicio));
  expect(fim).toBeGreaterThan(inicio);
  return HOOK.slice(inicio, fim + 1);
}

describe("Notificacoes: paginacao, filtro e busca no servidor (etapas 213-215)", () => {
  it("pede a contagem exata ao servidor — sem count nao existe total real", () => {
    expect(pagina()).toContain('count: "exact"');
  });

  it("recorta a pagina com range e nao com limit", () => {
    const q = pagina();
    expect(q).toContain(".range(from, to)");
    // `.limit()` junto de `.range()` corta a faixa e devolve pagina vazia na ultima.
    expect(HOOK).not.toContain(".limit(");
  });

  it("ordena por created_at e desempata por id, nessa ordem", () => {
    const q = pagina();
    const criado = q.indexOf('.order("created_at", { ascending: false })');
    const id = q.indexOf('.order("id", { ascending: false })');
    expect(criado).toBeGreaterThan(-1);
    expect(id).toBeGreaterThan(criado);
    // O desempate tem de vir antes do recorte, senao a faixa ja saiu instavel.
    expect(id).toBeLessThan(q.indexOf(".range(from, to)"));
  });

  it("manda os tres filtros para o banco em vez de filtrar em memoria", () => {
    const q = pagina();
    expect(q).toContain('.eq("user_id", userId)');
    expect(q).toContain('.eq("type", tipo as TipoNotificacao)');
    expect(q).toContain('.eq("read", leitura === "read")');
    expect(q).toContain("COLUNAS_BUSCA.map");
    expect(q).toContain(".ilike.");
  });

  it("busca em titulo e mensagem", () => {
    expect(HOOK).toContain('const COLUNAS_BUSCA = ["title", "message"] as const;');
  });

  it("limpa a sintaxe do PostgREST do termo digitado", () => {
    expect(HOOK).toContain('busca.trim().replace(/[%,()]/g, "")');
  });

  it("poe os filtros na queryKey para voltar a pagina 1 quando eles mudam", () => {
    expect(HOOK).toContain(
      '["notifications", userId, { tipo, leitura, busca: busca.trim() }]',
    );
  });

  it("nao consulta antes de saber o usuario", () => {
    expect(HOOK).toContain("enabled: !!userId");
  });

  it("conta o total e as nao lidas sem trazer linha (head: true)", () => {
    expect(HOOK.match(/head: true/g)?.length).toBe(2);
    expect(HOOK).toContain('.eq("read", false)');
  });

  it("a tela abandonou a paginacao e o filtro em memoria", () => {
    expect(TELA).not.toContain("usePagination");
    expect(TELA).not.toContain("useFilters");
    expect(TELA).not.toContain(".limit(200)");
    expect(TELA).not.toContain("filteredData");
    expect(TELA).toContain("useNotificacoesPage(userId");
  });

  it("a busca passa pelo debounce antes de virar consulta", () => {
    expect(TELA).toContain("const termo = useDebounce(searchInput, 350);");
    expect(TELA).toContain("busca: termo,");
    expect(TELA).toContain("search={searchInput}");
  });

  it("a selecao e a lista usam as linhas da pagina que veio do servidor", () => {
    expect(TELA).toContain("const rows = pagination.rows;");
    expect(TELA).toContain("useSelection(rows)");
    expect(TELA).toContain("{rows.map((n) => {");
  });

  it("mostra o total do servidor, nunca o tamanho da pagina", () => {
    expect(TELA).toContain("totalItems={pagination.total}");
    expect(TELA).toContain("totalFiltered={pagination.total}");
    expect(TELA).toContain("totalOriginal={stats.total}");
    expect(TELA).not.toContain("totalItems={rows.length}");
  });

  it("calcula a faixa exibida a partir do total do servidor", () => {
    expect(TELA).toContain(
      "(pagination.currentPage - 1) * pagination.pageSize + 1",
    );
    expect(TELA).toContain(
      "Math.min(\n              pagination.currentPage * pagination.pageSize,\n              pagination.total,\n            )",
    );
  });

  it("so mostra vazio ou paginacao depois que a consulta terminou", () => {
    expect(TELA).toContain("{!pagination.isLoading && rows.length === 0 && (");
    expect(TELA).toContain("{!pagination.isLoading && rows.length > 0 && (");
  });

  it("limpar filtros zera a busca da tela", () => {
    expect(TELA).toContain('setSearchInput("");');
  });

  it("oferece so os tipos que existem no enum do banco", () => {
    expect(TELA).not.toContain("Object.keys(typeConfig)");
    expect(TELA).toContain("TIPOS_NOTIFICACAO.map((t) => ({ value: t, label: t }))");
  });
});

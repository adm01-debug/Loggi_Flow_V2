import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = join(process.cwd(), "src/hooks/logistics/useLogisticsCalendar.tsx");
const src = readFileSync(HOOK, "utf8");
const PAGINA_COLETAS = readFileSync(join(process.cwd(), "src/pages/Coletas.tsx"), "utf8");
const PAGINA_ENVIOS = readFileSync(join(process.cwd(), "src/pages/Envios.tsx"), "utf8");

/** Um bloco de consulta do hook, do `let <nome>Query` ate o `await <nome>Query`. */
function bloco(nome: string): string {
  const inicio = src.indexOf(`let ${nome}Query = supabase`);
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf(`await ${nome}Query`, inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("useLogisticsCalendar: teto na leitura de entregas (etapa 208, P-01)", () => {
  it("limita a consulta de entregas no servidor", () => {
    expect(bloco("entregas")).toContain(".limit(500);");
  });

  it("ordena pela previsao antes de cortar", () => {
    const b = bloco("entregas");
    const ordem = b.indexOf(".order('previsao_entrega'");
    const corte = b.indexOf(".limit(");
    expect(ordem).toBeGreaterThan(-1);
    expect(corte).toBeGreaterThan(ordem);
    expect(b).toContain(".order('previsao_entrega', { ascending: true })");
  });

  it("usa o teto operacional ja adotado no repositorio", () => {
    expect(PAGINA_COLETAS).toContain(".limit(500)");
    expect(PAGINA_ENVIOS).toContain(".limit(500)");
    expect(bloco("entregas")).toContain(".limit(500)");
    // o unico filtro garantido hoje, 'previsao nao nula', nao limita nada
    expect(bloco("entregas")).toContain(".not('previsao_entrega', 'is', null)");
  });

  it("o teto e incondicional: vale antes de qualquer filtro opcional", () => {
    const b = bloco("entregas");
    const corte = b.indexOf(".limit(500)");
    const primeiroCondicional = b.indexOf("if (filters.status.length > 0)");
    expect(corte).toBeGreaterThan(-1);
    expect(primeiroCondicional).toBeGreaterThan(-1);
    expect(corte).toBeLessThan(primeiroCondicional);
  });

  it("nao mexe nos filtros condicionais de status e transportadora", () => {
    const b = bloco("entregas");
    expect(b).toContain("if (filters.status.length > 0)");
    expect(b).toContain("if (filters.transportadoraId)");
    expect(b).toContain("entregasQuery = entregasQuery.in('status', entregaStatuses);");
    expect(b).toContain("entregasQuery = entregasQuery.eq('transportadora_id', filters.transportadoraId);");
  });

  it("nao regride o teto de coletas da etapa 207", () => {
    const b = bloco("coletas");
    expect(b).toContain(".order('data_prevista_coleta', { ascending: true })");
    expect(b).toContain(".limit(500);");
  });
});

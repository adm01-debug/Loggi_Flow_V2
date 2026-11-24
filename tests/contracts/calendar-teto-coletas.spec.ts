import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = join(process.cwd(), "src/hooks/logistics/useLogisticsCalendar.tsx");
const src = readFileSync(HOOK, "utf8");
const COLETAS = readFileSync(join(process.cwd(), "src/pages/Coletas.tsx"), "utf8");
const ENVIOS = readFileSync(join(process.cwd(), "src/pages/Envios.tsx"), "utf8");

/** A consulta de coletas, do `let coletasQuery` ate o `await coletasQuery`. */
function blocoColetas(): string {
  const inicio = src.indexOf("let coletasQuery = supabase");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("await coletasQuery", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("useLogisticsCalendar: teto na leitura de coletas (etapa 207, P-01)", () => {
  it("limita a consulta de coletas no servidor", () => {
    expect(blocoColetas()).toContain(".limit(500);");
  });

  it("ordena pela data prevista antes de cortar", () => {
    const bloco = blocoColetas();
    const ordem = bloco.indexOf(".order('data_prevista_coleta'");
    const corte = bloco.indexOf(".limit(");
    expect(ordem).toBeGreaterThan(-1);
    expect(corte).toBeGreaterThan(ordem);
    expect(bloco).toContain(".order('data_prevista_coleta', { ascending: true })");
  });

  it("usa o teto operacional ja adotado no repositorio", () => {
    expect(COLETAS).toContain(".limit(500)");
    expect(ENVIOS).toContain(".limit(500)");
    expect(blocoColetas()).toContain(".limit(500)");
    // o unico filtro garantido hoje, 'data prevista nao nula', nao limita nada
    expect(blocoColetas()).toContain(".not('data_prevista_coleta', 'is', null)");
  });

  it("o teto e incondicional: vale antes de qualquer filtro opcional", () => {
    const bloco = blocoColetas();
    const corte = bloco.indexOf(".limit(500)");
    const primeiroCondicional = bloco.indexOf("if (filters.status.length > 0)");
    expect(corte).toBeGreaterThan(-1);
    expect(primeiroCondicional).toBeGreaterThan(-1);
    expect(corte).toBeLessThan(primeiroCondicional);
  });

  it("nao mexe nos filtros condicionais de status e transportadora", () => {
    const bloco = blocoColetas();
    expect(bloco).toContain("if (filters.status.length > 0)");
    expect(bloco).toContain("if (filters.transportadoraId)");
    expect(bloco).toContain("coletasQuery = coletasQuery.in('status', coletaStatuses);");
    expect(bloco).toContain("coletasQuery = coletasQuery.eq('transportadora_id', filters.transportadoraId);");
  });
});

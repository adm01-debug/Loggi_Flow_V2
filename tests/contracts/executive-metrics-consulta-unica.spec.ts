import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { waitFor } from "@testing-library/react";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { renderHookWithQuery } from "@/test/renderWithQuery";
import {
  chamadas,
  linhasAtuais,
  montarCenarioBordas,
  montarCenarioGrande,
  montarCenarioTeto,
  oracle,
  reiniciar,
} from "./executive-metrics-fixtures";

vi.mock("@/integrations/supabase/client", async () => {
  const { consultaMock } = await import("./executive-metrics-fixtures");
  return {
    supabase: { from: (tabela: string) => consultaMock(tabela as never) },
  };
});

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "u-teste" } }),
}));

const { useExecutiveMetrics } =
  await import("@/hooks/analytics/useExecutiveMetrics");

const FONTE = readFileSync(
  join(process.cwd(), "src/hooks/analytics/useExecutiveMetrics.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/[^\n]*/g, "");

/** O corpo do `queryFn` de `trends`, sem comentarios. */
function blocoTrends(): string {
  const inicio = FONTE.indexOf("queryFn: async (): Promise<MonthlyTrend[]>");
  expect(inicio).toBeGreaterThan(-1);
  const fim = FONTE.indexOf("staleTime:", inicio);
  return FONTE.slice(inicio, fim);
}

async function rodar() {
  const { result } = renderHookWithQuery(() => useExecutiveMetrics());
  await waitFor(() => expect(result.current.trends.isSuccess).toBe(true));
  return result.current.trends.data!;
}

beforeEach(() => {
  reiniciar();
});

describe("useExecutiveMetrics: uma consulta por tabela (etapa 221 / P-03)", () => {
  it("faz exatamente 3 consultas — uma por tabela — e nao 18", async () => {
    await rodar();
    expect(chamadas).toHaveLength(3);
    expect(chamadas.map((c) => c.tabela).sort()).toEqual([
      "coletas",
      "entregas",
      "ocorrencias",
    ]);
  });

  it("as tres consultas cobrem os seis meses de uma vez, com teto proporcional", async () => {
    const agora = new Date();
    await rodar();
    const esperadoInicio = startOfMonth(subMonths(agora, 5)).toISOString();
    const esperadoFim = endOfMonth(agora).toISOString();
    chamadas.forEach((c) => {
      expect(c.gte).toBe(esperadoInicio);
      expect(c.lte).toBe(esperadoFim);
      expect(c.colunas).toContain("created_at");
    });
    const porTabela = (t: string) => chamadas.find((c) => c.tabela === t)!;
    expect(porTabela("entregas").limit).toBe(6000);
    expect(porTabela("coletas").limit).toBe(6000);
    expect(porTabela("ocorrencias").limit).toBe(3000);
  });

  it("repete os seis meses do codigo anterior, campo por campo, com as bordas do mes", async () => {
    const agora = new Date();
    montarCenarioBordas(agora);
    const atual = await rodar();
    expect(atual).toEqual(oracle(agora, linhasAtuais()));
    // valores do mes corrente conferidos a mao: 5 entregas, 2 no prazo de 3 entregues, frete 660
    expect(atual).toHaveLength(6);
    expect(atual[5]).toEqual({
      month: format(agora, "MMM/yy"),
      entregas: 5,
      coletas: 3,
      ocorrencias: 4,
      custoFrete: 660,
      otif: 66.7,
    });
    // ordem cronologica: indice 0 = mes cinco atras, indice 5 = mes corrente
    expect(atual.map((m) => m.entregas)).toEqual([1, 1, 1, 1, 1, 5]);
    expect(atual.map((m) => m.coletas)).toEqual([0, 0, 0, 1, 0, 3]);
    expect(atual.map((m) => m.ocorrencias)).toEqual([0, 0, 0, 0, 1, 4]);
  });

  it("continua igual ao codigo anterior com setenta linhas espalhadas por oito meses", async () => {
    const agora = new Date();
    montarCenarioGrande(agora);
    const atual = await rodar();
    expect(atual).toEqual(oracle(agora, linhasAtuais()));
  });

  it("devolve os meses em ordem cronologica com o rotulo MMM/yy", async () => {
    const agora = new Date();
    montarCenarioGrande(agora);
    const atual = await rodar();
    const esperado = Array.from({ length: 6 })
      .map((_, i) => format(subMonths(agora, 5 - i), "MMM/yy"))
      .filter(Boolean);
    expect(atual.map((m) => m.month)).toEqual(esperado);
  });

  it("o teto corta o excesso em vez de carregar tudo (9000 ocorrencias viram 3000)", async () => {
    const agora = new Date();
    montarCenarioTeto(agora);
    const atual = await rodar();
    expect(chamadas.find((c) => c.tabela === "ocorrencias")!.limit).toBe(3000);
    expect(atual[5].ocorrencias).toBe(3000);
  });

  it("nao sobra consulta por mes, `for` no cliente nem agregacao no banco", () => {
    const bloco = blocoTrends();
    expect(bloco.match(/\.from\("/g) || []).toHaveLength(3);
    expect(bloco).not.toMatch(/for \(/);
    expect(bloco).not.toMatch(/monthsPromises/);
    expect(bloco).not.toMatch(/\.limit\(1000\)/);
    // as outras consultas do arquivo nao foram tocadas
    expect(FONTE).toContain(".limit(2000)");
    expect(FONTE).toContain(".limit(100)");
  });
});

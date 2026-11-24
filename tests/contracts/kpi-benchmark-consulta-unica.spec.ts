import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { waitFor } from "@testing-library/react";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { renderHookWithQuery } from "@/test/renderWithQuery";
import {
  chamadas,
  definirLinhas,
  linhasAtuais,
  montarCenarioBordas,
  montarCenarioGrande,
  oracle,
  reiniciar,
} from "./kpi-benchmark-fixtures";

vi.mock("@/integrations/supabase/client", async () => {
  const { consultaMock } = await import("./kpi-benchmark-fixtures");
  return {
    supabase: { from: (tabela: string) => consultaMock(tabela as never) },
  };
});

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "u-teste" } }),
}));

const { useKPIBenchmark } = await import("@/hooks/analytics/useKPIBenchmark");

const HOOK = readFileSync(
  join(process.cwd(), "src/hooks/analytics/useKPIBenchmark.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/[^\n]*/g, "");

/** O corpo do `queryFn`, sem comentarios. */
function consulta(): string {
  const inicio = HOOK.indexOf("queryFn: async () => {");
  expect(inicio).toBeGreaterThan(-1);
  const fim = HOOK.indexOf("staleTime:", inicio);
  return HOOK.slice(inicio, fim);
}

async function rodar(periodsBack: number) {
  const { result } = renderHookWithQuery(() => useKPIBenchmark(periodsBack));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  return result.current.data!;
}

beforeEach(() => {
  reiniciar();
});

describe("useKPIBenchmark: uma consulta por tabela (etapa 220 / P-03)", () => {
  it("faz exatamente 3 consultas — uma por tabela — e nao 18", async () => {
    const agora = new Date();
    definirLinhas("entregas", [
      {
        id: "e1",
        status: "entregue",
        created_at: new Date(agora).toISOString(),
      },
    ]);
    await rodar(6);
    expect(chamadas).toHaveLength(3);
    expect(chamadas.map((c) => c.tabela).sort()).toEqual([
      "coletas",
      "entregas",
      "ocorrencias",
    ]);
  });

  it("as tres consultas cobrem os seis meses de uma vez, com teto proporcional", async () => {
    const agora = new Date();
    await rodar(6);
    const esperadoInicio = startOfMonth(subMonths(agora, 5)).toISOString();
    const esperadoFim = endOfMonth(agora).toISOString();
    chamadas.forEach((c) => {
      expect(c.gte).toBe(esperadoInicio);
      expect(c.lte).toBe(esperadoFim);
      expect(c.limit).toBe(6000);
      expect(c.colunas).toContain("created_at");
    });
  });

  it("a consulta de ocorrencias tambem ganhou teto (achado A-01)", async () => {
    await rodar(6);
    const ocorrencias = chamadas.filter((c) => c.tabela === "ocorrencias");
    expect(ocorrencias).toHaveLength(1);
    expect(ocorrencias[0].limit).toBe(6000);
  });

  it("os seis pontos batem com o algoritmo anterior, campo por campo", async () => {
    const agora = new Date();
    montarCenarioBordas(agora);

    const { periods } = await rodar(6);
    const esperado = oracle(6, agora, linhasAtuais());
    // A comparacao e dos seis pontos inteiros, um por um: qualquer mes deslocado quebra aqui.
    expect(periods.map((p) => p.period)).toEqual(esperado.map((p) => p.period));
    periods.forEach((periodo, i) => {
      expect(periodo).toEqual(esperado[i]);
    });
    // Sanidade do cenario: no mes corrente entram 5 entregas (as duas de borda incluídas), 3 entregues,
    // 2 no prazo, frete 660 e 2 ocorrencias.
    const atual = periods.at(-1)!;
    expect(atual.totalEntregas).toBe(5);
    expect(atual.entregasNoPrazo).toBe(2);
    expect(atual.slaRate).toBeCloseTo(40, 6);
    expect(atual.custoTotal).toBe(660);
    expect(atual.custoMedio).toBeCloseTo(132, 6);
    expect(atual.ocorrencias).toBe(2);
    expect(atual.ocorrenciaRate).toBeCloseTo(40, 6);
    expect(atual.tempoMedioEntrega).toBeCloseTo(7 / 3, 6);
  });

  it("os seis pontos batem com o algoritmo anterior tambem com 40 linhas espalhadas", async () => {
    const agora = new Date();
    montarCenarioGrande(agora);

    const { periods, comparison } = await rodar(6);
    const esperado = oracle(6, agora, linhasAtuais());
    periods.forEach((periodo, i) => {
      expect(periodo).toEqual(esperado[i]);
    });
    expect(comparison!.current).toEqual(esperado.at(-1));
    expect(comparison!.previous).toEqual(esperado.at(-2));
  });

  it("a ordenacao por periodo continua ascendente", async () => {
    const agora = new Date();
    const { periods } = await rodar(6);
    const meses = periods.map((p) => p.period);
    expect([...meses].sort((a, b) => a.localeCompare(b))).toEqual(meses);
    expect(meses.at(-1)).toBe(format(agora, "yyyy-MM"));
    expect(meses[0]).toBe(format(subMonths(agora, 5), "yyyy-MM"));
  });

  it("nao existe mais laco com await dentro nem consulta por mes", () => {
    const q = consulta();
    expect(q).not.toContain("for (");
    expect(q).not.toContain("periodsBack; i++");
    expect(q).not.toContain(".limit(1000)");
    // Tres consultas nomeadas: `.from(` sozinho tambem casa com o `Array.from` do map dos meses.
    expect(q.match(/\.from\("/g) ?? []).toHaveLength(3);
    expect(q.match(/\.limit\(teto\)/g) ?? []).toHaveLength(3);
  });

  it("os calculos e a comparacao entre periodos nao mudaram", () => {
    const compactado = consulta().replace(/\s+/g, " ");
    expect(compactado).toContain(
      'entregasData.filter( (e) => e.status === "entregue" || e.status === "finalizado"',
    );
    expect(compactado).toContain(
      "totalEntregas > 0 ? (entregasNoPrazo / totalEntregas) * 100 : 0",
    );
    expect(compactado).toContain(
      "totalEntregas > 0 ? custoTotal / totalEntregas : 0",
    );
    expect(compactado).toContain(
      "(ocorrenciasData.length / totalEntregas) * 100",
    );
    expect(compactado).toContain(
      "entregasComTempo > 0 ? totalDiasEntrega / entregasComTempo : 0",
    );
    expect(HOOK).toContain(
      "periods.sort((a, b) => a.period.localeCompare(b.period));",
    );
    expect(compactado).toContain(
      "const current = periods[periods.length - 1];",
    );
    expect(compactado).toContain(
      "const previous = periods[periods.length - 2];",
    );
  });
});

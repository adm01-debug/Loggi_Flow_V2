import { describe, it, expect } from "vitest";
import {
  serieHistoricaFrete,
  projetarTendencia,
  montarPrevisaoFrete,
  gerarInsightsFrete,
  MESES_PROJECAO,
} from "./freightForecast";

const REF = new Date("2026-06-15T12:00:00Z");

function entrada(mes: string, valor: number) {
  return { created_at: `${mes}-10T12:00:00Z`, valor_frete: valor };
}

describe("serieHistoricaFrete", () => {
  it("devolve vazio sem entrada", () => {
    expect(serieHistoricaFrete([], REF)).toEqual([]);
  });

  it("soma por mes e completa mes vazio dentro da janela com zero", () => {
    const serie = serieHistoricaFrete(
      [entrada("2026-04", 100), entrada("2026-04", 50), entrada("2026-06", 80)],
      REF,
    );
    expect(serie).toEqual([
      { name: "Abr/26", total: 150 },
      { name: "Mai/26", total: 0 },
      { name: "Jun/26", total: 80 },
    ]);
  });

  it("nao recua alem de 6 meses mesmo com dado antigo", () => {
    const serie = serieHistoricaFrete(
      [entrada("2024-01", 999), entrada("2026-06", 10)],
      REF,
    );
    expect(serie).toHaveLength(6);
    expect(serie[0].name).toBe("Jan/26");
  });

  it("ignora data invalida", () => {
    const serie = serieHistoricaFrete(
      [{ created_at: "nao-e-data", valor_frete: 100 }, entrada("2026-06", 20)],
      REF,
    );
    expect(serie).toEqual([{ name: "Jun/26", total: 20 }]);
  });
});

describe("projetarTendencia", () => {
  it("extrapola reta perfeita", () => {
    expect(projetarTendencia([10, 20, 30], 2)).toEqual([40, 50]);
  });

  it("nao projeta valor negativo", () => {
    expect(projetarTendencia([100, 50, 10], 3).every((v) => v >= 0)).toBe(true);
  });

  it("exige ao menos 2 pontos", () => {
    expect(projetarTendencia([10], 3)).toEqual([]);
  });
});

describe("montarPrevisaoFrete", () => {
  it("nao projeta com menos de 3 meses de base", () => {
    const p = montarPrevisaoFrete([entrada("2026-06", 100)], REF);
    expect(p.temProjecao).toBe(false);
    expect(p.variacaoProjetada).toBeNull();
    expect(p.pontos.every((x) => x.pred === null)).toBe(true);
  });

  it("projeta 3 meses ancorados no ultimo real", () => {
    const p = montarPrevisaoFrete(
      [
        entrada("2026-04", 100),
        entrada("2026-05", 200),
        entrada("2026-06", 300),
      ],
      REF,
    );
    expect(p.temProjecao).toBe(true);
    expect(p.mesesReais).toBe(3);
    expect(p.pontos).toHaveLength(3 + MESES_PROJECAO);
    expect(p.pontos[2].pred).toBe(300);
    expect(p.pontos.slice(3).map((x) => x.name)).toEqual([
      "Jul/26",
      "Ago/26",
      "Set/26",
    ]);
    expect(p.variacaoProjetada).toBe(100);
  });

  it("devolve serie vazia quando nao ha frete", () => {
    const p = montarPrevisaoFrete([], REF);
    expect(p.pontos).toEqual([]);
    expect(p.temProjecao).toBe(false);
  });
});

describe("gerarInsightsFrete", () => {
  const vazio = {
    abusivos: [],
    consolidacao: [],
    melhorTransportadora: {},
    variacaoProjetada: null,
  };

  it("nao inventa insight sem dado", () => {
    expect(gerarInsightsFrete(vazio)).toEqual([]);
  });

  it("ignora variacao irrelevante", () => {
    expect(gerarInsightsFrete({ ...vazio, variacaoProjetada: 3 })).toEqual([]);
  });

  it("deriva cada insight da sua fonte real", () => {
    const insights = gerarInsightsFrete({
      abusivos: [{ estado: "SC", percentAbove: 42.4 }],
      consolidacao: [
        { estado: "PR", cidade: "Curitiba", potentialSavings: 900 },
      ],
      melhorTransportadora: {
        RS: { best: "Alfa", worst: "Beta", savings: 55 },
      },
      variacaoProjetada: -20,
    });
    expect(insights.map((i) => i.id)).toEqual([
      "tendencia",
      "abusivos",
      "consolidacao",
      "transportadora",
    ]);
    expect(insights[0].type).toBe("success");
    expect(insights[1].desc).toContain("42%");
    expect(insights[2].desc).toContain("Curitiba/PR");
    expect(insights[3].desc).toContain("Alfa");
  });

  it("descarta transportadora sem economia", () => {
    const insights = gerarInsightsFrete({
      ...vazio,
      melhorTransportadora: { SP: { best: "A", worst: "B", savings: 0 } },
    });
    expect(insights).toEqual([]);
  });
});

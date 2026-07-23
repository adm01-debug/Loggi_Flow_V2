import { describe, it, expect } from "vitest";
import { simulateWhatIf, WHATIF_MAX_CAP } from "./whatIfSimulator";
import type { RankedMitigation } from "./mitigationRecommender";
import type { RootCauseCategory } from "./rootCauseAnalyzer";

const CATEGORIES: RootCauseCategory[] = ["clima", "transportadora", "distancia", "feriado", "demanda", "endereco", "documentacao", "outros"];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRanked(cat: RootCauseCategory, opts: Partial<RankedMitigation> = {}): RankedMitigation {
  return {
    category: cat,
    priority: "media",
    headline: `Ação ${cat}`,
    actions: [],
    focusCarrier: null,
    impactScore: 50,
    effectiveScore: 50,
    roiAdjustment: 0,
    roiAvgDelta: null,
    roiMeasured: 0,
    ...opts,
  };
}

describe("simulateWhatIf — comportamento base", () => {
  it("retorna projeção neutra sem seleção", () => {
    const proj = simulateWhatIf([makeRanked("clima")], new Set(), 90);
    expect(proj.selectedCount).toBe(0);
    expect(proj.totalGain).toBe(0);
    expect(proj.projectedOtif).toBe(90);
    expect(proj.confidence).toBe(0);
  });

  it("usa Δ histórico quando measured>0", () => {
    const s = makeRanked("clima", { roiMeasured: 5, roiAvgDelta: 3 });
    const proj = simulateWhatIf([s], new Set(["clima"]), 80);
    expect(proj.contributions[0].source).toBe("historico");
    expect(proj.contributions[0].expectedGain).toBe(3);
    expect(proj.projectedOtif).toBeGreaterThan(80);
  });

  it("usa estimativa conservadora quando sem histórico", () => {
    const s = makeRanked("clima", { impactScore: 100 });
    const proj = simulateWhatIf([s], new Set(["clima"]), 70);
    expect(proj.contributions[0].source).toBe("estimado");
    expect(proj.contributions[0].expectedGain).toBeCloseTo(5, 5);
  });

  it("aplica diminishing returns em múltiplas seleções positivas", () => {
    const s1 = makeRanked("clima", { roiMeasured: 3, roiAvgDelta: 10 });
    const s2 = makeRanked("transportadora", { roiMeasured: 3, roiAvgDelta: 10 });
    const s3 = makeRanked("distancia", { roiMeasured: 3, roiAvgDelta: 10 });
    const proj = simulateWhatIf([s1, s2, s3], new Set(["clima", "transportadora", "distancia"]), 70);
    // soma ingênua = 30, com cap 25 e diminishing => < 25
    expect(proj.totalGain).toBeLessThan(25);
    expect(proj.totalGain).toBeGreaterThan(10);
  });

  it("mantém projeção em [0,100]", () => {
    const s = makeRanked("clima", { roiMeasured: 3, roiAvgDelta: 50 });
    const proj = simulateWhatIf([s], new Set(["clima"]), 99);
    expect(proj.projectedOtif).toBeLessThanOrEqual(100);
    const s2 = makeRanked("clima", { roiMeasured: 3, roiAvgDelta: -50 });
    const proj2 = simulateWhatIf([s2], new Set(["clima"]), 5);
    expect(proj2.projectedOtif).toBeGreaterThanOrEqual(0);
  });

  it("soma perdas linearmente", () => {
    const s1 = makeRanked("clima", { roiMeasured: 3, roiAvgDelta: -2 });
    const s2 = makeRanked("transportadora", { roiMeasured: 3, roiAvgDelta: -3 });
    const proj = simulateWhatIf([s1, s2], new Set(["clima", "transportadora"]), 90);
    expect(proj.totalGain).toBeCloseTo(-5, 2);
  });
});

describe("simulateWhatIf — fuzz 500 cenários", () => {
  it("invariantes: OTIF em [0,100], |totalGain| ≤ CAP + |perdas|, confiança em [0,1]", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = mulberry32(seed);
      const ranked: RankedMitigation[] = CATEGORIES.map((c) => {
        const hasHistory = rng() > 0.5;
        return makeRanked(c, {
          impactScore: Math.floor(rng() * 100),
          roiMeasured: hasHistory ? Math.floor(rng() * 5) + 1 : 0,
          roiAvgDelta: hasHistory ? (rng() * 20) - 10 : null,
        });
      });
      const selected = new Set<RootCauseCategory>(CATEGORIES.filter(() => rng() > 0.5));
      const baseline = rng() * 100;
      const proj = simulateWhatIf(ranked, selected, baseline);

      expect(proj.projectedOtif).toBeGreaterThanOrEqual(0);
      expect(proj.projectedOtif).toBeLessThanOrEqual(100);
      expect(proj.confidence).toBeGreaterThanOrEqual(0);
      expect(proj.confidence).toBeLessThanOrEqual(1);
      expect(proj.selectedCount).toBe(proj.contributions.length);

      // Cap superior: parte positiva nunca ultrapassa WHATIF_MAX_CAP
      const negativeSum = proj.contributions
        .filter((c) => c.expectedGain < 0)
        .reduce((s, c) => s + c.expectedGain, 0);
      const positivePart = proj.totalGain - negativeSum;
      expect(positivePart).toBeLessThanOrEqual(WHATIF_MAX_CAP + 1e-6);
      expect(positivePart).toBeGreaterThanOrEqual(-1e-6);
    }
  });
});

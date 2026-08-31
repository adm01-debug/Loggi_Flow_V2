import { describe, it, expect } from "vitest";
import { compareScenarios, type ScenarioLike } from "./whatIfCompare";
import type { RootCauseCategory } from "./rootCauseAnalyzer";

const CATS: RootCauseCategory[] = [
  "clima", "transportadora", "distancia", "feriado",
  "demanda", "endereco", "documentacao", "outros",
];

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

function mk(id: string, over: Partial<ScenarioLike> = {}): ScenarioLike {
  return {
    id,
    name: id,
    baselineOtif: 80,
    projectedOtif: 85,
    totalGain: 5,
    confidence: 0.5,
    categories: ["clima"],
    ...over,
  };
}

describe("compareScenarios — base", () => {
  it("calcula deltas simples e vencedor por OTIF", () => {
    const a = mk("a", { projectedOtif: 82, totalGain: 2, confidence: 0.4 });
    const b = mk("b", { projectedOtif: 88, totalGain: 8, confidence: 0.6 });
    const d = compareScenarios(a, b);
    expect(d.projectedDelta).toBe(6);
    expect(d.gainDelta).toBe(6);
    expect(d.confidenceDelta).toBe(0.2);
    expect(d.winner).toBe("b");
  });

  it("empate em OTIF → desempata por confiança", () => {
    const a = mk("a", { projectedOtif: 85, confidence: 0.7 });
    const b = mk("b", { projectedOtif: 85, confidence: 0.3 });
    expect(compareScenarios(a, b).winner).toBe("a");
  });

  it("empate total → tie", () => {
    const a = mk("a");
    const b = mk("b");
    expect(compareScenarios(a, b).winner).toBe("tie");
  });

  it("jaccard=1 para conjuntos iguais, 0 para disjuntos", () => {
    const a = mk("a", { categories: ["clima", "feriado"] });
    const b = mk("b", { categories: ["clima", "feriado"] });
    expect(compareScenarios(a, b).jaccard).toBe(1);
    const c = mk("c", { categories: ["distancia"] });
    expect(compareScenarios(a, c).jaccard).toBe(0);
  });

  it("detecta baselineDrift", () => {
    const a = mk("a", { baselineOtif: 80 });
    const b = mk("b", { baselineOtif: 72 });
    expect(compareScenarios(a, b).baselineDrift).toBe(-8);
  });

  it("categorias particionadas corretamente", () => {
    const a = mk("a", { categories: ["clima", "feriado"] });
    const b = mk("b", { categories: ["feriado", "distancia"] });
    const d = compareScenarios(a, b);
    expect(d.sharedCategories).toEqual(["feriado"]);
    expect(d.onlyInA).toEqual(["clima"]);
    expect(d.onlyInB).toEqual(["distancia"]);
  });
});

describe("compareScenarios — fuzz 500 cenários", () => {
  it("invariantes: jaccard∈[0,1], winner coerente com projectedDelta, partições disjuntas", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = mulberry32(seed);
      const pickCats = (): RootCauseCategory[] =>
        CATS.filter(() => rng() > 0.5);
      const a: ScenarioLike = {
        id: `a${seed}`,
        name: "a",
        baselineOtif: rng() * 100,
        projectedOtif: rng() * 100,
        totalGain: (rng() * 40) - 20,
        confidence: rng(),
        categories: pickCats(),
      };
      const b: ScenarioLike = {
        id: `b${seed}`,
        name: "b",
        baselineOtif: rng() * 100,
        projectedOtif: rng() * 100,
        totalGain: (rng() * 40) - 20,
        confidence: rng(),
        categories: pickCats(),
      };
      const d = compareScenarios(a, b);

      expect(d.jaccard).toBeGreaterThanOrEqual(0);
      expect(d.jaccard).toBeLessThanOrEqual(1);

      // Winner por OTIF quando há diferença significativa
      if (Math.abs(d.projectedDelta) > 0.01) {
        expect(d.winner).toBe(d.projectedDelta > 0 ? "b" : "a");
      }

      // Partições disjuntas e completas
      const shared = new Set(d.sharedCategories);
      const onlyA = new Set(d.onlyInA);
      const onlyB = new Set(d.onlyInB);
      for (const c of shared) {
        expect(onlyA.has(c)).toBe(false);
        expect(onlyB.has(c)).toBe(false);
      }
      const union = new Set<RootCauseCategory>([...a.categories, ...b.categories]);
      expect(shared.size + onlyA.size + onlyB.size).toBe(union.size);
    }
  });
});

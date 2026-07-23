import { describe, it, expect } from "vitest";
import {
  buildMitigations,
  priorityFromScore,
  scoreImpact,
  type MitigationPriority,
} from "./mitigationRecommender";
import type { CategoryBucket, RootCauseCategory, RootCauseReport } from "./rootCauseAnalyzer";

const CATEGORIES: RootCauseCategory[] = [
  "clima", "transportadora", "distancia", "feriado", "demanda", "endereco", "documentacao", "outros",
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

function makeBucket(cat: RootCauseCategory, count: number, hours: number, carriers: Record<string, number> = {}): CategoryBucket {
  return { category: cat, count, totalDelayHours: hours, carriers, sampleMotivos: [] };
}

function makeReport(buckets: CategoryBucket[]): RootCauseReport {
  const sorted = [...buckets].sort((a, b) => b.count - a.count);
  return {
    totalAnalyzed: sorted.reduce((s, b) => s + b.count, 0),
    totalWithDelay: sorted.reduce((s, b) => s + b.count, 0),
    buckets: sorted,
    topCarrier: null,
    topCategory: sorted[0]?.category ?? null,
  };
}

describe("scoreImpact / priorityFromScore", () => {
  it("bucket dominante recebe score 100", () => {
    const s = scoreImpact(makeBucket("clima", 10, 100), 10, 100);
    expect(s).toBe(100);
    expect(priorityFromScore(s)).toBe("alta");
  });

  it("bucket vazio recebe score 0", () => {
    expect(scoreImpact(makeBucket("outros", 0, 0), 10, 100)).toBe(0);
    expect(priorityFromScore(0)).toBe("baixa");
  });

  it("bordas de prioridade são estáveis", () => {
    expect(priorityFromScore(70)).toBe("alta");
    expect(priorityFromScore(69)).toBe("media");
    expect(priorityFromScore(35)).toBe("media");
    expect(priorityFromScore(34)).toBe("baixa");
  });

  it("aceita maxCount/maxHours zerados sem NaN", () => {
    expect(scoreImpact(makeBucket("clima", 0, 0), 0, 0)).toBe(0);
  });
});

describe("buildMitigations", () => {
  it("retorna [] para relatório vazio", () => {
    expect(buildMitigations(makeReport([]))).toEqual([]);
  });

  it("gera uma sugestão por bucket com playbook preenchido", () => {
    const report = makeReport([makeBucket("clima", 5, 20, { Rodonaves: 3, Lalamove: 2 })]);
    const [m] = buildMitigations(report);
    expect(m.category).toBe("clima");
    expect(m.headline.length).toBeGreaterThan(0);
    expect(m.actions.length).toBeGreaterThanOrEqual(3);
    expect(m.focusCarrier).toBe("Rodonaves");
    expect(m.priority).toBe("alta");
    expect(m.impactScore).toBe(100);
  });

  it("respeita a ordem por severidade de impacto", () => {
    const report = makeReport([
      makeBucket("clima", 10, 50),
      makeBucket("transportadora", 3, 5),
    ]);
    const results = buildMitigations(report);
    expect(results[0].impactScore).toBeGreaterThan(results[1].impactScore);
  });
});

describe("Fuzz — 500 cenários de recomendações", () => {
  it("mantém invariantes em 500 relatórios aleatórios", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rand = mulberry32(seed);
      const nBuckets = 1 + Math.floor(rand() * CATEGORIES.length);
      const chosen = [...CATEGORIES].sort(() => rand() - 0.5).slice(0, nBuckets);
      const buckets = chosen.map((c) => {
        const count = 1 + Math.floor(rand() * 50);
        const hours = Math.floor(rand() * 200);
        const carriers: Record<string, number> = {};
        const nCarriers = 1 + Math.floor(rand() * 3);
        for (let i = 0; i < nCarriers; i++) {
          carriers[`C${i}`] = 1 + Math.floor(rand() * count);
        }
        return makeBucket(c, count, hours, carriers);
      });
      const report = makeReport(buckets);
      const suggestions = buildMitigations(report);

      // Invariantes:
      expect(suggestions).toHaveLength(buckets.length);
      const priorities: MitigationPriority[] = suggestions.map((s) => s.priority);
      expect(priorities.every((p) => ["alta", "media", "baixa"].includes(p))).toBe(true);
      for (const s of suggestions) {
        expect(s.impactScore).toBeGreaterThanOrEqual(0);
        expect(s.impactScore).toBeLessThanOrEqual(100);
        expect(s.actions.length).toBeGreaterThanOrEqual(3);
      }
      // O bucket com mais frequência tem score >= 70 (freq=1.0 => 0.7 min).
      const top = suggestions.sort((a, b) => b.impactScore - a.impactScore)[0];
      expect(top.impactScore).toBeGreaterThanOrEqual(70);
      expect(top.priority).toBe("alta");
    }
  });
});

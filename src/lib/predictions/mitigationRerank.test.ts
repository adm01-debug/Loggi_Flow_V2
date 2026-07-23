import { describe, it, expect } from "vitest";
import { buildMitigations, rerankByROI } from "./mitigationRecommender";
import type { RootCauseReport } from "./rootCauseAnalyzer";
import type { ROIReport, CategoryROI } from "./mitigationROI";

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

const CATEGORIES = ["clima", "transportadora", "distancia", "feriado", "demanda", "endereco", "documentacao", "outros"] as const;

function makeReport(rng: () => number): RootCauseReport {
  const buckets = CATEGORIES.map((c) => ({
    category: c,
    count: Math.floor(rng() * 30) + 1,
    totalDelayHours: rng() * 200,
    carriers: {},
    sampleMotivos: [],
  })).sort((a, b) => b.count - a.count);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  return { totalAnalyzed: total, totalWithDelay: total, buckets, topCarrier: null, topCategory: buckets[0].category };
}

function makeROI(rng: () => number): ROIReport {
  const byCategory: CategoryROI[] = CATEGORIES.filter(() => rng() > 0.3).map((c) => ({
    category: c,
    totalActions: Math.floor(rng() * 10) + 1,
    measuredActions: Math.floor(rng() * 8) + 1,
    avgDelta: (rng() * 20) - 10,
    bestDelta: rng() * 10,
    worstDelta: -rng() * 10,
    successRate: rng() * 100,
    roiScore: Math.floor(rng() * 100),
  }));
  return { byCategory, totalMeasured: byCategory.length, overallAvgDelta: 0, topCategory: null, worstCategory: null };
}

describe("rerankByROI — comportamento base", () => {
  it("retorna score original quando ROI é null", () => {
    const report = makeReport(mulberry32(1));
    const base = buildMitigations(report);
    const ranked = rerankByROI(base, null);
    for (const r of ranked) {
      expect(r.effectiveScore).toBe(r.impactScore);
      expect(r.roiAdjustment).toBe(0);
    }
  });

  it("aplica boost para categorias com Δ OTIF positivo", () => {
    const report = makeReport(mulberry32(2));
    const base = buildMitigations(report);
    const target = base[0].category;
    const roi: ROIReport = {
      byCategory: [{ category: target, totalActions: 3, measuredActions: 3, avgDelta: 8, bestDelta: 10, worstDelta: 5, successRate: 100, roiScore: 90 }],
      totalMeasured: 3, overallAvgDelta: 8, topCategory: target, worstCategory: target,
    };
    const ranked = rerankByROI(base, roi);
    const found = ranked.find((r) => r.category === target)!;
    expect(found.roiAdjustment).toBeGreaterThan(0);
    expect(found.effectiveScore).toBeGreaterThanOrEqual(found.impactScore);
  });

  it("penaliza categorias com Δ OTIF negativo", () => {
    const report = makeReport(mulberry32(3));
    const base = buildMitigations(report);
    const target = base[0].category;
    const roi: ROIReport = {
      byCategory: [{ category: target, totalActions: 3, measuredActions: 3, avgDelta: -8, bestDelta: 1, worstDelta: -12, successRate: 10, roiScore: 5 }],
      totalMeasured: 3, overallAvgDelta: -8, topCategory: target, worstCategory: target,
    };
    const ranked = rerankByROI(base, roi);
    const found = ranked.find((r) => r.category === target)!;
    expect(found.roiAdjustment).toBeLessThan(0);
    expect(found.effectiveScore).toBeLessThanOrEqual(found.impactScore);
  });

  it("ignora categorias sem measured > 0", () => {
    const report = makeReport(mulberry32(4));
    const base = buildMitigations(report);
    const target = base[0].category;
    const roi: ROIReport = {
      byCategory: [{ category: target, totalActions: 3, measuredActions: 0, avgDelta: 5, bestDelta: 0, worstDelta: 0, successRate: 0, roiScore: 0 }],
      totalMeasured: 0, overallAvgDelta: 0, topCategory: null, worstCategory: null,
    };
    const ranked = rerankByROI(base, roi);
    const found = ranked.find((r) => r.category === target)!;
    expect(found.roiAdjustment).toBe(0);
  });
});

describe("rerankByROI — fuzz 500 cenários", () => {
  it("mantém invariantes: score em [0,100], ordenação decrescente, ajuste em [-30,+30]", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = mulberry32(seed);
      const report = makeReport(rng);
      const roi = makeROI(rng);
      const base = buildMitigations(report);
      const ranked = rerankByROI(base, roi);

      expect(ranked).toHaveLength(base.length);
      for (const r of ranked) {
        expect(r.effectiveScore).toBeGreaterThanOrEqual(0);
        expect(r.effectiveScore).toBeLessThanOrEqual(100);
        expect(r.roiAdjustment).toBeGreaterThanOrEqual(-30);
        expect(r.roiAdjustment).toBeLessThanOrEqual(30);
      }
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].effectiveScore).toBeGreaterThanOrEqual(ranked[i].effectiveScore);
      }
    }
  });
});

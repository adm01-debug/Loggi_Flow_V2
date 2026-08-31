import { describe, it, expect } from "vitest";
import { computeROI, type MitigationRecord } from "./mitigationROI";
import type { RootCauseCategory } from "./rootCauseAnalyzer";
import type { MitigationPriority } from "./mitigationRecommender";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const CATS: RootCauseCategory[] = ["clima", "transportadora", "distancia", "feriado", "demanda", "endereco", "documentacao", "outros"];
const PRIS: MitigationPriority[] = ["alta", "media", "baixa"];

function makeRec(rand: () => number): MitigationRecord {
  const before = 80 + rand() * 15;
  const after = before + (rand() * 20 - 10);
  return {
    category: CATS[Math.floor(rand() * CATS.length)],
    priority: PRIS[Math.floor(rand() * PRIS.length)],
    status: rand() > 0.2 ? "concluida" : "em_execucao",
    impact_score: Math.floor(rand() * 100),
    otif_before: before,
    otif_after: after,
    otif_delta: Number((after - before).toFixed(2)),
  };
}

describe("mitigationROI", () => {
  it("retorna relatório vazio sem registros", () => {
    const r = computeROI([]);
    expect(r.byCategory).toHaveLength(0);
    expect(r.totalMeasured).toBe(0);
    expect(r.topCategory).toBeNull();
  });

  it("ignora ações não concluídas", () => {
    const r = computeROI([
      { category: "clima", priority: "alta", status: "planejada", impact_score: 80, otif_before: 90, otif_after: 95, otif_delta: 5 },
    ]);
    expect(r.totalMeasured).toBe(0);
  });

  it("calcula avg/best/worst e taxa de sucesso", () => {
    const recs: MitigationRecord[] = [
      { category: "clima", priority: "alta", status: "concluida", impact_score: 80, otif_before: 90, otif_after: 95, otif_delta: 5 },
      { category: "clima", priority: "alta", status: "concluida", impact_score: 80, otif_before: 90, otif_after: 92, otif_delta: 2 },
      { category: "clima", priority: "alta", status: "concluida", impact_score: 80, otif_before: 90, otif_after: 88, otif_delta: -2 },
    ];
    const r = computeROI(recs);
    const cat = r.byCategory.find((c) => c.category === "clima");
    expect(cat).toBeDefined();
    expect(cat!.avgDelta).toBeCloseTo(1.67, 1);
    expect(cat!.bestDelta).toBe(5);
    expect(cat!.worstDelta).toBe(-2);
    expect(cat!.successRate).toBeCloseTo(66.7, 1);
  });

  it("roiScore está sempre em 0-100", () => {
    const rand = mulberry32(42);
    const recs = Array.from({ length: 200 }, () => makeRec(rand));
    const r = computeROI(recs);
    for (const c of r.byCategory) {
      expect(c.roiScore).toBeGreaterThanOrEqual(0);
      expect(c.roiScore).toBeLessThanOrEqual(100);
      expect(c.successRate).toBeGreaterThanOrEqual(0);
      expect(c.successRate).toBeLessThanOrEqual(100);
    }
  });

  it("ordena categorias por roiScore desc", () => {
    const rand = mulberry32(7);
    const recs = Array.from({ length: 500 }, () => makeRec(rand));
    const r = computeROI(recs);
    for (let i = 1; i < r.byCategory.length; i++) {
      expect(r.byCategory[i - 1].roiScore).toBeGreaterThanOrEqual(r.byCategory[i].roiScore);
    }
    if (r.byCategory.length > 0) {
      expect(r.topCategory).toBe(r.byCategory[0].category);
      expect(r.worstCategory).toBe(r.byCategory[r.byCategory.length - 1].category);
    }
  });

  it("fuzz 500 cenários: invariantes de agregação", () => {
    const rand = mulberry32(1234);
    for (let i = 0; i < 500; i++) {
      const n = Math.floor(rand() * 40);
      const recs = Array.from({ length: n }, () => makeRec(rand));
      const r = computeROI(recs);
      const measured = recs.filter((x) => x.status === "concluida" && x.otif_delta != null && Number.isFinite(x.otif_delta)).length;
      expect(r.totalMeasured).toBe(measured);
      for (const c of r.byCategory) {
        expect(c.measuredActions).toBeGreaterThan(0);
        expect(c.bestDelta).toBeGreaterThanOrEqual(c.worstDelta);
        expect(c.avgDelta).toBeGreaterThanOrEqual(c.worstDelta - 0.01);
        expect(c.avgDelta).toBeLessThanOrEqual(c.bestDelta + 0.01);
        expect(c.totalActions).toBeGreaterThanOrEqual(c.measuredActions);
      }
    }
  });

  it("ignora deltas não-finitos", () => {
    const r = computeROI([
      { category: "clima", priority: "alta", status: "concluida", impact_score: 80, otif_before: null, otif_after: null, otif_delta: NaN },
      { category: "clima", priority: "alta", status: "concluida", impact_score: 80, otif_before: 90, otif_after: 92, otif_delta: 2 },
    ]);
    expect(r.totalMeasured).toBe(1);
    expect(r.byCategory[0].avgDelta).toBe(2);
  });
});

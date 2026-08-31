import { describe, it, expect } from "vitest";
import { aggregateSnapshots, type SLOSnapshotRow } from "./useSLOSnapshots";

function makeRow(partial: Partial<SLOSnapshotRow>, index = 0): SLOSnapshotRow {
  return {
    id: `row-${index}`,
    day: "2026-07-01",
    gateway: "tracking",
    checks: 96,
    failures: 0,
    uptime_pct: 100,
    avg_latency_ms: 200,
    p95_latency_ms: 400,
    error_budget_used_pct: 0,
    status: "ok",
    uptime_target_pct: 99,
    latency_p95_budget_ms: 3000,
    ...partial,
  };
}

/** PRNG determinístico (mulberry32) para fuzz reprodutível. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("aggregateSnapshots", () => {
  it("retorna vazio sem linhas", () => {
    expect(aggregateSnapshots([])).toEqual([]);
  });

  it("agrupa por gateway e conta dias", () => {
    const result = aggregateSnapshots([
      makeRow({ day: "2026-07-01" }, 0),
      makeRow({ day: "2026-07-02" }, 1),
      makeRow({ gateway: "quotation" }, 2),
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.gateway === "tracking")?.days).toBe(2);
  });

  it("conta dias violados e pior P95", () => {
    const [item] = aggregateSnapshots([
      makeRow({ status: "violado", p95_latency_ms: 5000 }, 0),
      makeRow({ day: "2026-07-02", status: "ok", p95_latency_ms: 300 }, 1),
    ]);
    expect(item.violatedDays).toBe(1);
    expect(item.worstP95Ms).toBe(5000);
  });

  it("ordena por budget médio decrescente", () => {
    const result = aggregateSnapshots([
      makeRow({ gateway: "a", error_budget_used_pct: 10 }, 0),
      makeRow({ gateway: "b", error_budget_used_pct: 90 }, 1),
    ]);
    expect(result[0].gateway).toBe("b");
  });

  it("mantém invariantes em 500 cenários de fuzz", () => {
    const rand = mulberry32(20260726);
    for (let scenario = 0; scenario < 500; scenario += 1) {
      const count = Math.floor(rand() * 30);
      const rows: SLOSnapshotRow[] = Array.from({ length: count }, (_, index) =>
        makeRow(
          {
            gateway: `gw-${Math.floor(rand() * 4)}`,
            day: `2026-07-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
            uptime_pct: Math.round(rand() * 1000) / 10,
            p95_latency_ms: Math.floor(rand() * 9000),
            error_budget_used_pct: Math.round(rand() * 2000) / 10,
            status: (["ok", "atencao", "violado"] as const)[Math.floor(rand() * 3)],
          },
          index,
        ),
      );

      const aggregates = aggregateSnapshots(rows);
      expect(aggregates.reduce((sum, item) => sum + item.days, 0)).toBe(rows.length);
      for (const item of aggregates) {
        expect(item.avgUptimePct).toBeGreaterThanOrEqual(0);
        expect(item.avgUptimePct).toBeLessThanOrEqual(100);
        expect(item.violatedDays).toBeLessThanOrEqual(item.days);
        expect(item.worstP95Ms).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(item.avgBudgetUsedPct)).toBe(true);
      }
      for (let i = 1; i < aggregates.length; i += 1) {
        expect(aggregates[i - 1].avgBudgetUsedPct).toBeGreaterThanOrEqual(
          aggregates[i].avgBudgetUsedPct,
        );
      }
    }
  });
});

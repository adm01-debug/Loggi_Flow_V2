import { describe, it, expect } from "vitest";
import {
  buildLatencyTrend,
  computeDrift,
  type LatencySample,
  type LatencyTrendPoint,
} from "./latencyTrend";

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

const BASE = Date.UTC(2026, 6, 26, 0, 0, 0);

function sample(offsetMinutes: number, latency: number, online = true, gateway = "tracking"): LatencySample {
  return {
    gateway,
    online,
    latency_ms: latency,
    checked_at: new Date(BASE + offsetMinutes * 60_000).toISOString(),
  };
}

describe("buildLatencyTrend", () => {
  it("retorna vazio para entrada vazia", () => {
    const trend = buildLatencyTrend([]);
    expect(trend.points).toEqual([]);
    expect(trend.driftPct).toBe(0);
    expect(trend.degrading).toBe(false);
  });

  it("agrupa amostras da mesma hora em um único bucket", () => {
    const trend = buildLatencyTrend([sample(0, 100), sample(30, 300)]);
    expect(trend.points).toHaveLength(1);
    expect(trend.points[0].checks).toBe(2);
    expect(trend.points[0].avgLatencyMs).toBe(200);
  });

  it("separa buckets por hora e ordena cronologicamente", () => {
    const trend = buildLatencyTrend([sample(120, 100), sample(0, 50), sample(60, 80)]);
    expect(trend.points.map((p) => p.label)).toEqual(["00:00", "01:00", "02:00"]);
  });

  it("respeita bucketMinutes customizado", () => {
    const trend = buildLatencyTrend([sample(0, 10), sample(20, 20)], { bucketMinutes: 15 });
    expect(trend.points).toHaveLength(2);
  });

  it("calcula uptime por bucket", () => {
    const trend = buildLatencyTrend([sample(0, 10, true), sample(1, 10, false)]);
    expect(trend.points[0].uptimePct).toBe(50);
  });

  it("filtra por gateway", () => {
    const trend = buildLatencyTrend([sample(0, 10, true, "tracking"), sample(1, 900, true, "pickup")], {
      gateway: "pickup",
    });
    expect(trend.points[0].avgLatencyMs).toBe(900);
  });

  it("descarta amostras com data inválida", () => {
    const trend = buildLatencyTrend([
      { gateway: "a", online: true, latency_ms: 10, checked_at: "not-a-date" },
      sample(0, 20),
    ]);
    expect(trend.points).toHaveLength(1);
    expect(trend.points[0].checks).toBe(1);
  });

  it("descarta latência não numérica", () => {
    const trend = buildLatencyTrend([
      { gateway: "a", online: true, latency_ms: Number.NaN, checked_at: new Date(BASE).toISOString() },
    ]);
    expect(trend.points).toHaveLength(0);
  });

  it("normaliza latência negativa para zero", () => {
    const trend = buildLatencyTrend([sample(0, -500)]);
    expect(trend.points[0].avgLatencyMs).toBe(0);
  });

  it("detecta degradação quando a segunda metade piora", () => {
    const trend = buildLatencyTrend([
      sample(0, 100),
      sample(60, 100),
      sample(120, 400),
      sample(180, 400),
    ]);
    expect(trend.degrading).toBe(true);
    expect(trend.driftPct).toBeCloseTo(300, 5);
  });

  it("não marca degradação em latência estável", () => {
    const trend = buildLatencyTrend([sample(0, 100), sample(60, 105), sample(120, 98)]);
    expect(trend.degrading).toBe(false);
  });

  it("respeita threshold customizado", () => {
    const points = [sample(0, 100), sample(60, 130)];
    expect(buildLatencyTrend(points, { degradationThresholdPct: 50 }).degrading).toBe(false);
    expect(buildLatencyTrend(points, { degradationThresholdPct: 10 }).degrading).toBe(true);
  });

  it("tolera lista nula sem lançar", () => {
    expect(() => buildLatencyTrend(undefined as unknown as LatencySample[])).not.toThrow();
  });
});

describe("computeDrift", () => {
  const point = (avg: number): LatencyTrendPoint => ({
    bucketStart: new Date(BASE).toISOString(),
    label: "00:00",
    checks: 1,
    avgLatencyMs: avg,
    p95LatencyMs: avg,
    uptimePct: 100,
  });

  it("retorna 0 com menos de 2 pontos", () => {
    expect(computeDrift([])).toBe(0);
    expect(computeDrift([point(10)])).toBe(0);
  });

  it("retorna 100 quando a base é zero e há piora", () => {
    expect(computeDrift([point(0), point(50)])).toBe(100);
  });

  it("retorna 0 quando tudo é zero", () => {
    expect(computeDrift([point(0), point(0)])).toBe(0);
  });

  it("é negativo quando há melhora", () => {
    expect(computeDrift([point(200), point(100)])).toBeCloseTo(-50, 5);
  });
});

describe("fuzz: 500 cenários aleatórios determinísticos", () => {
  it("mantém todas as invariantes", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rand = mulberry32(seed);
      const count = Math.floor(rand() * 80);
      const bucketMinutes = 1 + Math.floor(rand() * 120);
      const samples: LatencySample[] = [];

      for (let i = 0; i < count; i++) {
        const roll = rand();
        if (roll < 0.08) {
          // Amostra corrompida proposital.
          samples.push({
            gateway: "tracking",
            online: rand() > 0.5,
            latency_ms: rand() > 0.5 ? Number.NaN : 10,
            checked_at: rand() > 0.5 ? "invalid" : new Date(BASE + i * 60_000).toISOString(),
          });
          continue;
        }
        samples.push({
          gateway: rand() > 0.5 ? "tracking" : "pickup",
          online: rand() > 0.2,
          latency_ms: Math.floor(rand() * 5000) - 200,
          checked_at: new Date(BASE + Math.floor(rand() * 86_400_000)).toISOString(),
        });
      }

      const trend = buildLatencyTrend(samples, { bucketMinutes });

      // Ordenação cronológica estrita.
      for (let i = 1; i < trend.points.length; i++) {
        expect(new Date(trend.points[i].bucketStart).getTime()).toBeGreaterThan(
          new Date(trend.points[i - 1].bucketStart).getTime(),
        );
      }

      for (const p of trend.points) {
        expect(p.checks).toBeGreaterThan(0);
        expect(p.avgLatencyMs).toBeGreaterThanOrEqual(0);
        expect(p.p95LatencyMs).toBeGreaterThanOrEqual(p.avgLatencyMs);
        expect(p.uptimePct).toBeGreaterThanOrEqual(0);
        expect(p.uptimePct).toBeLessThanOrEqual(100);
        expect(Number.isFinite(p.avgLatencyMs)).toBe(true);
      }

      const validCount = samples.filter(
        (s) => Number.isFinite(s.latency_ms) && Number.isFinite(new Date(s.checked_at).getTime()),
      ).length;
      const totalChecks = trend.points.reduce((sum, p) => sum + p.checks, 0);
      expect(totalChecks).toBe(validCount);
      expect(Number.isFinite(trend.driftPct)).toBe(true);
    }
  });
});

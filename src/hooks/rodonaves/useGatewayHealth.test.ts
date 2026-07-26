import { describe, it, expect } from "vitest";
import { aggregateUptime, type GatewayHealthRow } from "./useGatewayHealth";

function row(partial: Partial<GatewayHealthRow>): GatewayHealthRow {
  return {
    id: crypto.randomUUID(),
    gateway: "tracking",
    online: true,
    http_status: 200,
    latency_ms: 100,
    error_message: null,
    checked_at: new Date().toISOString(),
    ...partial,
  };
}

/** PRNG determinístico para fuzz reproduzível. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("aggregateUptime", () => {
  it("retorna vazio para histórico vazio", () => {
    expect(aggregateUptime([])).toEqual([]);
  });

  it("calcula uptime percentual corretamente", () => {
    const result = aggregateUptime([
      row({ online: true }),
      row({ online: false }),
      row({ online: true }),
      row({ online: true }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].uptimePct).toBe(75);
    expect(result[0].checks).toBe(4);
  });

  it("separa métricas por gateway", () => {
    const result = aggregateUptime([
      row({ gateway: "tracking", online: true }),
      row({ gateway: "pickup", online: false }),
    ]);
    expect(result.map((r) => r.gateway).sort()).toEqual(["pickup", "tracking"]);
  });

  it("ordena do pior uptime para o melhor", () => {
    const result = aggregateUptime([
      row({ gateway: "a", online: true }),
      row({ gateway: "b", online: false }),
    ]);
    expect(result[0].gateway).toBe("b");
  });

  it("usa a checagem mais recente para lastOnline", () => {
    const older = new Date(Date.now() - 60_000).toISOString();
    const newer = new Date().toISOString();
    const result = aggregateUptime([
      row({ online: true, checked_at: older }),
      row({ online: false, checked_at: newer }),
    ]);
    expect(result[0].lastOnline).toBe(false);
    expect(result[0].lastCheckedAt).toBe(newer);
  });

  it("calcula média e P95 de latência", () => {
    const rows = [10, 20, 30, 40, 1000].map((latency_ms) => row({ latency_ms }));
    const [agg] = aggregateUptime(rows);
    expect(agg.avgLatencyMs).toBe(220);
    expect(agg.p95LatencyMs).toBe(1000);
  });

  it("tolera latência zero sem quebrar", () => {
    const [agg] = aggregateUptime([row({ latency_ms: 0 })]);
    expect(agg.avgLatencyMs).toBe(0);
    expect(agg.p95LatencyMs).toBe(0);
  });

  it("fuzz: 500 cenários mantêm invariantes de agregação", () => {
    const rand = mulberry32(20260726);
    const gateways = ["tracking", "quotation", "pickup", "customer", "dne"];

    for (let scenario = 0; scenario < 500; scenario++) {
      const size = Math.floor(rand() * 40);
      const rows: GatewayHealthRow[] = Array.from({ length: size }, () =>
        row({
          gateway: gateways[Math.floor(rand() * gateways.length)],
          online: rand() > 0.3,
          latency_ms: Math.floor(rand() * 30_000),
          checked_at: new Date(Date.now() - Math.floor(rand() * 86_400_000)).toISOString(),
        }),
      );

      const result = aggregateUptime(rows);
      const totalChecks = result.reduce((sum, r) => sum + r.checks, 0);
      expect(totalChecks).toBe(rows.length);

      for (const agg of result) {
        expect(agg.uptimePct).toBeGreaterThanOrEqual(0);
        expect(agg.uptimePct).toBeLessThanOrEqual(100);
        expect(agg.avgLatencyMs).toBeGreaterThanOrEqual(0);
        expect(agg.p95LatencyMs).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(agg.avgLatencyMs)).toBe(true);
      }

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].uptimePct).toBeLessThanOrEqual(result[i].uptimePct);
      }
    }
  });
});

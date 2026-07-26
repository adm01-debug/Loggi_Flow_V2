import { describe, it, expect } from "vitest";
import {
  DEFAULT_SLO_TARGET,
  evaluateAllSLO,
  evaluateSLO,
  normalizeTarget,
  summarizeSLO,
  type GatewaySLOInput,
} from "./gatewaySLO";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function input(partial: Partial<GatewaySLOInput> = {}): GatewaySLOInput {
  return { gateway: "tracking", checks: 10, uptimePct: 100, p95LatencyMs: 500, ...partial };
}

describe("normalizeTarget", () => {
  it("usa padrões quando ausente", () => {
    expect(normalizeTarget(undefined)).toEqual(DEFAULT_SLO_TARGET);
  });

  it("limita valores fora da faixa", () => {
    expect(normalizeTarget({ uptimeTargetPct: 300, latencyP95BudgetMs: -5 })).toEqual({
      uptimeTargetPct: 100,
      latencyP95BudgetMs: 50,
    });
  });

  it("tolera NaN", () => {
    expect(normalizeTarget({ uptimeTargetPct: Number.NaN }).uptimeTargetPct).toBe(50);
  });
});

describe("evaluateSLO", () => {
  it("gateway perfeito fica ok com 0% de budget consumido", () => {
    const r = evaluateSLO(input());
    expect(r.status).toBe("ok");
    expect(r.errorBudgetUsedPct).toBe(0);
    expect(r.errorBudgetLeftPct).toBe(100);
  });

  it("consome budget proporcionalmente ao downtime", () => {
    const r = evaluateSLO(input({ uptimePct: 99.5 }), { uptimeTargetPct: 99 });
    expect(r.errorBudgetUsedPct).toBe(50);
    expect(r.status).toBe("ok");
  });

  it("marca atenção a partir de 75% do budget", () => {
    const r = evaluateSLO(input({ uptimePct: 99.2 }), { uptimeTargetPct: 99 });
    expect(r.errorBudgetUsedPct).toBe(80);
    expect(r.status).toBe("atencao");
  });

  it("viola quando o budget é totalmente consumido", () => {
    const r = evaluateSLO(input({ uptimePct: 98 }), { uptimeTargetPct: 99 });
    expect(r.status).toBe("violado");
    expect(r.errorBudgetLeftPct).toBe(0);
  });

  it("viola por latência acima do budget mesmo com uptime perfeito", () => {
    const r = evaluateSLO(input({ p95LatencyMs: 5000 }), { latencyP95BudgetMs: 2000 });
    expect(r.latencyOverBudgetMs).toBe(3000);
    expect(r.status).toBe("violado");
  });

  it("meta 100% não divide por zero", () => {
    const perfect = evaluateSLO(input(), { uptimeTargetPct: 100 });
    expect(perfect.errorBudgetUsedPct).toBe(0);
    const broken = evaluateSLO(input({ uptimePct: 99.9 }), { uptimeTargetPct: 100 });
    expect(broken.errorBudgetUsedPct).toBe(100);
    expect(broken.status).toBe("violado");
  });

  it("sanitiza entradas inválidas", () => {
    const r = evaluateSLO(input({ uptimePct: Number.NaN, p95LatencyMs: -10, checks: 2.7 }));
    expect(r.uptimePct).toBe(0);
    expect(r.p95LatencyMs).toBe(0);
    expect(r.checks).toBe(2);
  });
});

describe("evaluateAllSLO / summarizeSLO", () => {
  it("ordena do pior para o melhor", () => {
    const results = evaluateAllSLO([
      input({ gateway: "a", uptimePct: 100 }),
      input({ gateway: "b", uptimePct: 90 }),
    ]);
    expect(results[0].gateway).toBe("b");
  });

  it("resume corretamente", () => {
    const s = summarizeSLO(
      evaluateAllSLO([input({ gateway: "a" }), input({ gateway: "b", uptimePct: 50 })]),
    );
    expect(s).toMatchObject({ total: 2, ok: 1, violado: 1 });
  });

  it("resumo vazio é neutro", () => {
    expect(summarizeSLO([])).toEqual({ total: 0, ok: 0, atencao: 0, violado: 0, avgBudgetUsedPct: 0 });
  });

  it("fuzz: 500 cenários mantêm invariantes de SLO", () => {
    const rand = mulberry32(20260727);
    const gateways = ["tracking", "quotation", "pickup", "customer", "dne"];

    for (let scenario = 0; scenario < 500; scenario++) {
      const size = Math.floor(rand() * 12);
      const inputs: GatewaySLOInput[] = Array.from({ length: size }, (_, i) => ({
        gateway: `${gateways[Math.floor(rand() * gateways.length)]}-${i}`,
        checks: Math.floor(rand() * 500),
        uptimePct: rand() * 120 - 10,
        p95LatencyMs: rand() * 40_000 - 1000,
      }));
      const target = {
        uptimeTargetPct: rand() * 120,
        latencyP95BudgetMs: rand() * 50_000,
      };

      const results = evaluateAllSLO(inputs, target);
      expect(results).toHaveLength(size);

      for (const r of results) {
        expect(r.uptimePct).toBeGreaterThanOrEqual(0);
        expect(r.uptimePct).toBeLessThanOrEqual(100);
        expect(r.errorBudgetUsedPct).toBeGreaterThanOrEqual(0);
        expect(r.errorBudgetLeftPct).toBeGreaterThanOrEqual(0);
        expect(r.errorBudgetLeftPct).toBeLessThanOrEqual(100);
        expect(r.latencyOverBudgetMs).toBeGreaterThanOrEqual(0);
        expect(["ok", "atencao", "violado"]).toContain(r.status);
        expect(Number.isFinite(r.errorBudgetUsedPct)).toBe(true);
      }

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].errorBudgetUsedPct).toBeGreaterThanOrEqual(results[i].errorBudgetUsedPct);
      }

      const summary = summarizeSLO(results);
      expect(summary.ok + summary.atencao + summary.violado).toBe(size);
    }
  });
});

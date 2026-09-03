import { describe, it, expect } from "vitest";
import { evaluateAllSLO } from "./gatewaySLO";
import {
  applyAlerts,
  evaluateSLOAlerts,
  loadAlertState,
  saveAlertState,
  severityForStatus,
  summarizeAlerts,
  type AlertState,
} from "./sloAlerts";

const HOUR = 60 * 60 * 1000;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("severityForStatus", () => {
  it("mapeia status para severidade", () => {
    expect(severityForStatus("violado")).toBe("critical");
    expect(severityForStatus("atencao")).toBe("warning");
    expect(severityForStatus("ok")).toBe("info");
  });
});

describe("evaluateSLOAlerts", () => {
  const violated = evaluateAllSLO([
    { gateway: "tracking", checks: 10, uptimePct: 50, p95LatencyMs: 9000 },
  ]);

  it("dispara alerta crítico sem histórico", () => {
    const alerts = evaluateSLOAlerts(violated, [], { now: 1_000_000 });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].firedAt).toBe(1_000_000);
  });

  it("ignora gateways saudáveis com minSeverity padrão", () => {
    const ok = evaluateAllSLO([
      { gateway: "pickup", checks: 10, uptimePct: 100, p95LatencyMs: 100 },
    ]);
    expect(evaluateSLOAlerts(ok, [], { now: 1 })).toHaveLength(0);
    expect(
      evaluateSLOAlerts(ok, [], { now: 1, minSeverity: "info" }),
    ).toHaveLength(1);
  });

  it("respeita cooldown para mesma severidade", () => {
    const prev: AlertState[] = [
      { gateway: "tracking", severity: "critical", firedAt: 0 },
    ];
    expect(evaluateSLOAlerts(violated, prev, { now: HOUR / 2 })).toHaveLength(
      0,
    );
    expect(evaluateSLOAlerts(violated, prev, { now: HOUR + 1 })).toHaveLength(
      1,
    );
  });

  it("ignora cooldown em escalonamento de severidade", () => {
    const prev: AlertState[] = [
      { gateway: "tracking", severity: "warning", firedAt: 0 },
    ];
    expect(evaluateSLOAlerts(violated, prev, { now: 1 })).toHaveLength(1);
  });

  it("usa rótulo amigável na mensagem", () => {
    const [alert] = evaluateSLOAlerts(
      violated,
      [],
      { now: 1 },
      { tracking: "Rastreio" },
    );
    expect(alert.message).toContain("Rastreio");
  });

  it("tolera cooldown e now inválidos", () => {
    const alerts = evaluateSLOAlerts(violated, [], {
      now: Number.NaN,
      cooldownMs: Number.NaN,
    });
    expect(alerts).toHaveLength(1);
    expect(Number.isFinite(alerts[0].firedAt)).toBe(true);
  });
});

describe("applyAlerts / summarizeAlerts", () => {
  it("atualiza estado por gateway", () => {
    const alerts = evaluateSLOAlerts(
      evaluateAllSLO([
        { gateway: "dne", checks: 5, uptimePct: 10, p95LatencyMs: 100 },
      ]),
      [],
      { now: 500 },
    );
    const state = applyAlerts(
      [{ gateway: "dne", severity: "warning", firedAt: 0 }],
      alerts,
    );
    expect(state).toHaveLength(1);
    expect(state[0].severity).toBe("critical");
    expect(state[0].firedAt).toBe(500);
  });

  it("resume alertas por severidade", () => {
    const summary = summarizeAlerts([
      {
        gateway: "a",
        severity: "critical",
        message: "",
        errorBudgetUsedPct: 100,
        latencyOverBudgetMs: 0,
        firedAt: 0,
      },
      {
        gateway: "b",
        severity: "warning",
        message: "",
        errorBudgetUsedPct: 80,
        latencyOverBudgetMs: 0,
        firedAt: 0,
      },
    ]);
    expect(summary).toEqual({ total: 2, critical: 1, warning: 1, info: 0 });
  });
});

describe("persistência", () => {
  it("retorna vazio para storage corrompido", () => {
    localStorage.setItem("rte-gateway-slo-alert-state", "{{{");
    expect(loadAlertState()).toEqual([]);
  });

  it("faz round-trip do estado", () => {
    saveAlertState([
      { gateway: "tracking", severity: "critical", firedAt: 42 },
    ]);
    expect(loadAlertState()).toEqual([
      { gateway: "tracking", severity: "critical", firedAt: 42 },
    ]);
  });
});

describe("fuzz determinístico (500 cenários)", () => {
  it("mantém invariantes de severidade, cooldown e ordenação", () => {
    const rand = mulberry32(1337);
    for (let i = 0; i < 500; i += 1) {
      const count = 1 + Math.floor(rand() * 8);
      const inputs = Array.from({ length: count }, (_, index) => ({
        gateway: `gw-${index}`,
        checks: Math.floor(rand() * 100),
        uptimePct: rand() * 110 - 5,
        p95LatencyMs: rand() * 12000 - 500,
      }));
      const results = evaluateAllSLO(inputs);
      const now = Math.floor(rand() * 1_000_000);
      const previous: AlertState[] = results
        .filter(() => rand() > 0.5)
        .map((r) => ({
          gateway: r.gateway,
          severity: rand() > 0.5 ? "critical" : "warning",
          firedAt: Math.max(0, now - Math.floor(rand() * 3 * HOUR)),
        }));

      const alerts = evaluateSLOAlerts(results, previous, {
        now,
        cooldownMs: HOUR,
      });

      // Cada alerta corresponde a um gateway avaliado e nunca é "info" por padrão.
      for (const alert of alerts) {
        expect(results.some((r) => r.gateway === alert.gateway)).toBe(true);
        expect(alert.severity).not.toBe("info");
        expect(alert.firedAt).toBe(now);
        expect(alert.errorBudgetUsedPct).toBeGreaterThanOrEqual(0);
        expect(alert.latencyOverBudgetMs).toBeGreaterThanOrEqual(0);
      }

      // Sem duplicatas por gateway.
      expect(new Set(alerts.map((a) => a.gateway)).size).toBe(alerts.length);

      // Ordenação por severidade decrescente.
      for (let k = 1; k < alerts.length; k += 1) {
        const order = { info: 0, warning: 1, critical: 2 } as const;
        expect(order[alerts[k - 1].severity]).toBeGreaterThanOrEqual(
          order[alerts[k].severity],
        );
      }

      // O estado resultante cobre todos os gateways disparados.
      const state = applyAlerts(previous, alerts);
      for (const alert of alerts) {
        expect(
          state.some((s) => s.gateway === alert.gateway && s.firedAt === now),
        ).toBe(true);
      }

      // Reexecução imediata não redispara (mesma severidade, dentro do cooldown).
      expect(
        evaluateSLOAlerts(results, state, { now, cooldownMs: HOUR }),
      ).toHaveLength(0);
    }
  });
});

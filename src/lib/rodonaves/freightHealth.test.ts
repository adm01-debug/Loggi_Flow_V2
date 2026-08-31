import { describe, it, expect } from "vitest";
import {
  businessDaysBetween,
  evaluateFreightBatch,
  evaluateFreightHealth,
  summarizeFreightHealth,
  type FreightSnapshot,
} from "./freightHealth";
import type { RTERawEvent } from "./eventCodes";

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

const NOW = new Date("2026-06-15T12:00:00Z"); // segunda-feira

function ev(
  eventCode: string,
  procedaCode: string,
  date: string,
): RTERawEvent {
  return { system: "event", eventCode, procedaCode, date };
}

describe("businessDaysBetween", () => {
  it("ignora fins de semana", () => {
    // 2026-06-08 (seg) → 2026-06-15 (seg) = 5 dias úteis
    expect(
      businessDaysBetween(
        new Date("2026-06-08T00:00:00Z"),
        new Date("2026-06-15T00:00:00Z"),
      ),
    ).toBe(5);
  });

  it("ignora feriados nacionais fixos", () => {
    // 2026-09-07 é segunda (Independência)
    const days = businessDaysBetween(
      new Date("2026-09-04T00:00:00Z"),
      new Date("2026-09-11T00:00:00Z"),
    );
    expect(days).toBe(4);
  });

  it("aceita feriados customizados", () => {
    const days = businessDaysBetween(
      new Date("2026-06-08T00:00:00Z"),
      new Date("2026-06-15T00:00:00Z"),
      ["2026-06-10"],
    );
    expect(days).toBe(4);
  });

  it("retorna 0 para intervalos inválidos ou invertidos", () => {
    expect(
      businessDaysBetween(new Date("2026-06-15"), new Date("2026-06-08")),
    ).toBe(0);
    expect(businessDaysBetween(new Date("invalid"), NOW)).toBe(0);
  });
});

describe("evaluateFreightHealth", () => {
  it("marca frete entregue sem anomalias", () => {
    const freight: FreightSnapshot = {
      id: "F1",
      emissionDate: "2026-06-01T09:00:00Z",
      expectedDeliveryDays: 5,
      events: [
        ev("0", "0", "2026-06-01T10:00:00Z"),
        ev("3", "99", "2026-06-04T08:00:00Z"),
        ev("6", "1", "2026-06-04T15:00:00Z"),
      ],
    };
    const health = evaluateFreightHealth(freight, { now: NOW });
    expect(health.delivered).toBe(true);
    expect(health.inProgress).toBe(false);
    expect(health.businessDaysOverdue).toBe(0);
    expect(health.anomalies).toEqual([]);
    expect(health.severity).toBe("info");
  });

  it("detecta atraso por dias úteis", () => {
    const freight: FreightSnapshot = {
      id: "F2",
      emissionDate: "2026-06-01T09:00:00Z",
      expectedDeliveryDays: 3,
      events: [ev("1", "99", "2026-06-15T08:00:00Z")],
    };
    const health = evaluateFreightHealth(freight, { now: NOW });
    expect(health.anomalies).toContain("atrasado");
    expect(health.businessDaysOverdue).toBeGreaterThan(0);
  });

  it("detecta frete parado há mais de 48h", () => {
    const freight: FreightSnapshot = {
      id: "F3",
      emissionDate: "2026-06-10T09:00:00Z",
      expectedDeliveryDays: 30,
      events: [ev("1", "99", "2026-06-11T08:00:00Z")],
    };
    const health = evaluateFreightHealth(freight, { now: NOW });
    expect(health.anomalies).toContain("parado");
    expect(health.hoursSinceLastEvent).toBeGreaterThan(48);
  });

  it("isenta EventCode 2 (na unidade de destino) da regra de parado", () => {
    const freight: FreightSnapshot = {
      id: "F4",
      emissionDate: "2026-06-10T09:00:00Z",
      expectedDeliveryDays: 30,
      events: [ev("2", "98", "2026-06-11T08:00:00Z")],
    };
    const health = evaluateFreightHealth(freight, { now: NOW });
    expect(health.anomalies).not.toContain("parado");
  });

  it("eleva severidade para crítico em avaria", () => {
    const freight: FreightSnapshot = {
      id: "F5",
      emissionDate: "2026-06-12T09:00:00Z",
      expectedDeliveryDays: 30,
      events: [ev("3", "8", "2026-06-15T08:00:00Z")],
    };
    const health = evaluateFreightHealth(freight, { now: NOW });
    expect(health.severity).toBe("critico");
    expect(health.anomalies).toContain("excecao");
    expect(health.exceptions).toHaveLength(1);
  });

  it("tolera trilha vazia e datas inválidas", () => {
    const health = evaluateFreightHealth(
      { id: "F6", emissionDate: "não-é-data", expectedDeliveryDays: NaN, events: [] },
      { now: NOW },
    );
    expect(health.lastEvent).toBeNull();
    expect(health.businessDaysElapsed).toBe(0);
    expect(health.hoursSinceLastEvent).toBeNull();
    expect(health.anomalies).toEqual([]);
  });
});

describe("summarizeFreightHealth", () => {
  it("agrega métricas de painel", () => {
    const freights: FreightSnapshot[] = [
      {
        id: "A",
        emissionDate: "2026-06-10T09:00:00Z",
        expectedDeliveryDays: 10,
        events: [ev("6", "1", "2026-06-12T09:00:00Z")],
      },
      {
        id: "B",
        emissionDate: "2026-05-01T09:00:00Z",
        expectedDeliveryDays: 2,
        events: [ev("1", "99", "2026-05-02T09:00:00Z")],
      },
    ];
    const summary = summarizeFreightHealth(
      evaluateFreightBatch(freights, { now: NOW }),
    );
    expect(summary.total).toBe(2);
    expect(summary.delivered).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.delayed).toBe(1);
    expect(summary.stalled).toBe(1);
    expect(summary.healthyRate).toBe(50);
  });

  it("retorna 100% saudável para lote vazio", () => {
    expect(summarizeFreightHealth([]).healthyRate).toBe(100);
  });
});

describe("fuzz — 500 fretes determinísticos", () => {
  it("mantém invariantes de saúde", () => {
    const rand = mulberry32(987654321);
    const EVENTS: Array<[string, string]> = [
      ["0", "0"], ["1", "99"], ["1.1", "99"], ["2", "98"],
      ["3", "99"], ["6", "1"], ["3", "8"], ["3", "9"], ["6", "12"],
    ];

    const freights: FreightSnapshot[] = Array.from({ length: 500 }, (_, i) => {
      const size = 1 + Math.floor(rand() * 6);
      const startMs = NOW.getTime() - Math.floor(rand() * 60) * 86_400_000;
      const events: RTERawEvent[] = Array.from({ length: size }, (_, k) => {
        const [eventCode, procedaCode] =
          EVENTS[Math.floor(rand() * EVENTS.length)];
        return ev(
          eventCode,
          procedaCode,
          new Date(startMs + k * 43_200_000).toISOString(),
        );
      });
      return {
        id: `FZ-${i}`,
        emissionDate: new Date(startMs).toISOString(),
        expectedDeliveryDays: Math.floor(rand() * 15),
        events,
      };
    });

    const results = evaluateFreightBatch(freights, { now: NOW });
    expect(results).toHaveLength(500);

    for (const health of results) {
      expect(health.businessDaysElapsed).toBeGreaterThanOrEqual(0);
      expect(health.businessDaysOverdue).toBeGreaterThanOrEqual(0);
      // Entregue nunca acumula atraso nem fica parado.
      if (health.delivered) {
        expect(health.businessDaysOverdue).toBe(0);
        expect(health.anomalies).not.toContain("atrasado");
        expect(health.anomalies).not.toContain("parado");
      }
      // inProgress é o complemento exato de delivered.
      expect(health.inProgress).toBe(!health.delivered);
      // Severidade crítica exige exceção crítica registrada.
      if (health.severity === "critico") {
        expect(health.exceptions.length).toBeGreaterThan(0);
      }
      // Anomalias não se repetem.
      expect(new Set(health.anomalies).size).toBe(health.anomalies.length);
    }

    const summary = summarizeFreightHealth(results);
    expect(summary.total).toBe(500);
    expect(summary.delivered + summary.inProgress).toBe(500);
    expect(summary.healthyRate).toBeGreaterThanOrEqual(0);
    expect(summary.healthyRate).toBeLessThanOrEqual(100);
    expect(summary.critical).toBeLessThanOrEqual(summary.withExceptions);
  });
});

import { describe, it, expect } from "vitest";
import { buildSLOReport, sloReportToCSV, summarizeSLOReport, type SLOReportSample } from "./sloReport";

function sample(overrides: Partial<SLOReportSample> = {}): SLOReportSample {
  return {
    gateway: "quotation",
    online: true,
    latency_ms: 500,
    checked_at: "2026-07-20T10:00:00.000Z",
    ...overrides,
  };
}

/** PRNG determinístico (mulberry32) para fuzz reproduzível. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("buildSLOReport", () => {
  it("retorna relatório vazio sem amostras", () => {
    const report = buildSLOReport([]);
    expect(report.rows).toEqual([]);
    expect(report.summary.rows).toBe(0);
    expect(report.summary.worstGateway).toBeNull();
  });

  it("agrupa por dia e gateway", () => {
    const report = buildSLOReport([
      sample(),
      sample({ checked_at: "2026-07-20T23:00:00.000Z" }),
      sample({ gateway: "tracking" }),
      sample({ checked_at: "2026-07-21T01:00:00.000Z" }),
    ]);
    expect(report.rows).toHaveLength(3);
    expect(report.summary.days).toBe(2);
    expect(report.summary.gateways).toBe(2);
  });

  it("calcula uptime e falhas corretamente", () => {
    const report = buildSLOReport([
      sample(),
      sample({ online: false, latency_ms: 0 }),
      sample(),
      sample(),
    ]);
    expect(report.rows[0].checks).toBe(4);
    expect(report.rows[0].failures).toBe(1);
    expect(report.rows[0].uptimePct).toBe(75);
  });

  it("marca violação quando o uptime fica abaixo da meta", () => {
    const report = buildSLOReport(
      [sample(), sample({ online: false })],
      { uptimeTargetPct: 99, latencyP95BudgetMs: 5000 },
    );
    expect(report.rows[0].status).toBe("violado");
    expect(report.summary.violatedRows).toBe(1);
    expect(report.summary.compliancePct).toBe(0);
  });

  it("ignora amostras inválidas", () => {
    const report = buildSLOReport([
      sample(),
      sample({ checked_at: "não-é-data" }),
      { gateway: "", online: true, latency_ms: 1, checked_at: "2026-07-20T10:00:00.000Z" },
    ]);
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0].checks).toBe(1);
  });

  it("trata latências inválidas como zero", () => {
    const report = buildSLOReport([sample({ latency_ms: Number.NaN }), sample({ latency_ms: -50 })]);
    expect(report.rows[0].avgLatencyMs).toBe(0);
    expect(report.rows[0].p95LatencyMs).toBe(0);
  });

  it("elege o pior gateway pelo budget acumulado", () => {
    const report = buildSLOReport(
      [
        sample({ gateway: "a", online: false }),
        sample({ gateway: "a", online: false }),
        sample({ gateway: "b" }),
      ],
      { uptimeTargetPct: 99, latencyP95BudgetMs: 5000 },
    );
    expect(report.summary.worstGateway).toBe("a");
  });
});

describe("summarizeSLOReport", () => {
  it("é consistente com o relatório construído", () => {
    const report = buildSLOReport([sample(), sample({ gateway: "tracking", online: false })]);
    expect(summarizeSLOReport(report.rows)).toEqual(report.summary);
  });
});

describe("sloReportToCSV", () => {
  it("gera cabeçalho mesmo sem linhas", () => {
    expect(sloReportToCSV([])).toContain("dia;gateway");
  });

  it("emite uma linha por registro", () => {
    const report = buildSLOReport([sample(), sample({ gateway: "tracking" })]);
    const csv = sloReportToCSV(report.rows);
    expect(csv.split("\r\n")).toHaveLength(3);
  });

  it("neutraliza injeção de fórmula", () => {
    const csv = sloReportToCSV([
      {
        day: "2026-07-20",
        gateway: "=CMD()",
        checks: 1,
        failures: 0,
        uptimePct: 100,
        avgLatencyMs: 1,
        p95LatencyMs: 1,
        errorBudgetUsedPct: 0,
        status: "ok",
      },
    ]);
    expect(csv).toContain(`"'=CMD()"`);
  });
});

describe("fuzz: 500 cenários", () => {
  it("mantém invariantes estruturais", () => {
    const random = mulberry32(20260726);
    const gateways = ["quotation", "tracking", "pickup", "orders"];

    for (let scenario = 0; scenario < 500; scenario += 1) {
      const count = Math.floor(random() * 40);
      const samples: SLOReportSample[] = [];
      for (let i = 0; i < count; i += 1) {
        const dayOffset = Math.floor(random() * 7);
        samples.push({
          gateway: gateways[Math.floor(random() * gateways.length)],
          online: random() > 0.2,
          latency_ms: random() > 0.05 ? Math.floor(random() * 8000) : Number.NaN,
          checked_at: new Date(Date.UTC(2026, 6, 1 + dayOffset, Math.floor(random() * 24))).toISOString(),
        });
      }

      const report = buildSLOReport(samples, {
        uptimeTargetPct: 90 + random() * 10,
        latencyP95BudgetMs: 100 + random() * 5000,
      });

      const totalChecks = report.rows.reduce((sum, row) => sum + row.checks, 0);
      expect(totalChecks).toBe(samples.length);

      for (const row of report.rows) {
        expect(row.uptimePct).toBeGreaterThanOrEqual(0);
        expect(row.uptimePct).toBeLessThanOrEqual(100);
        expect(row.avgLatencyMs).toBeLessThanOrEqual(row.p95LatencyMs);
        expect(row.failures).toBeLessThanOrEqual(row.checks);
        expect(Number.isFinite(row.errorBudgetUsedPct)).toBe(true);
      }

      for (let i = 1; i < report.rows.length; i += 1) {
        const previous = report.rows[i - 1];
        const current = report.rows[i];
        const ordered =
          previous.day < current.day ||
          (previous.day === current.day && previous.gateway <= current.gateway);
        expect(ordered).toBe(true);
      }

      expect(report.summary.compliantRows + report.summary.violatedRows).toBe(report.rows.length);
      expect(sloReportToCSV(report.rows).split("\r\n")).toHaveLength(report.rows.length + 1);
    }
  });
});

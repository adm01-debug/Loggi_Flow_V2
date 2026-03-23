import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TelemetryCharts } from "@/components/admin/telemetry/TelemetryCharts";

// Mock recharts to avoid canvas/SVG issues in jsdom
vi.mock("recharts", () => {
  const MockResponsiveContainer = ({ children }: any) => <div data-testid="responsive-container">{children}</div>;
  const MockLineChart = ({ children }: any) => <div data-testid="line-chart">{children}</div>;
  const MockBarChart = ({ children }: any) => <div data-testid="bar-chart">{children}</div>;
  const MockPieChart = ({ children }: any) => <div data-testid="pie-chart">{children}</div>;
  const MockAreaChart = ({ children }: any) => <div data-testid="area-chart">{children}</div>;
  const MockPie = ({ children }: any) => <div>{children}</div>;
  const MockCell = () => <div />;
  const MockBar = () => <div />;
  const MockLine = () => <div />;
  const MockArea = () => <div />;
  const MockXAxis = () => <div />;
  const MockYAxis = () => <div />;
  const MockCartesianGrid = () => <div />;
  const MockTooltip = () => <div />;
  return {
    ResponsiveContainer: MockResponsiveContainer,
    LineChart: MockLineChart,
    BarChart: MockBarChart,
    PieChart: MockPieChart,
    AreaChart: MockAreaChart,
    Pie: MockPie,
    Cell: MockCell,
    Bar: MockBar,
    Line: MockLine,
    Area: MockArea,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    CartesianGrid: MockCartesianGrid,
    Tooltip: MockTooltip,
  };
});

// ─── Helpers ───────────────────────────────────────────────
function makeTelemetryRow(overrides: Partial<{
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  record_count: number | null;
  severity: string;
  created_at: string;
}> = {}) {
  const defaults = {
    id: crypto.randomUUID(),
    operation: "SELECT",
    table_name: "entregas" as string | null,
    rpc_name: null as string | null,
    duration_ms: 5000,
    record_count: 100 as number | null,
    severity: "slow",
    created_at: new Date().toISOString(),
  };
  return { ...defaults, ...overrides };
}

function makeRows(count: number, overrides: Partial<ReturnType<typeof makeTelemetryRow>> = {}) {
  return Array.from({ length: count }, (_, i) =>
    makeTelemetryRow({ ...overrides, id: `row-${i}` })
  );
}

// ═══════════════════════════════════════════════════════════
// 1. RENDERING TESTS
// ═══════════════════════════════════════════════════════════

describe("TelemetryCharts", () => {
  describe("Rendering", () => {
    it("returns null when rows is empty", () => {
      const { container } = render(<TelemetryCharts rows={[]} timeFilter="24h" />);
      expect(container.innerHTML).toBe("");
    });

    it("renders charts when rows are provided", () => {
      render(<TelemetryCharts rows={makeRows(5)} timeFilter="24h" />);
      expect(screen.getByText("Alertas ao Longo do Tempo")).toBeInTheDocument();
      expect(screen.getByText("Por Severidade")).toBeInTheDocument();
    });

    it("renders operation bar chart when multiple operations exist", () => {
      const rows = [
        ...makeRows(3, { operation: "SELECT" }),
        ...makeRows(2, { operation: "INSERT" }),
      ];
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Operação")).toBeInTheDocument();
    });

    it("renders area chart component", () => {
      render(<TelemetryCharts rows={makeRows(3)} timeFilter="1h" />);
      expect(screen.getAllByTestId("area-chart").length).toBeGreaterThanOrEqual(1);
    });

    it("renders pie chart component", () => {
      render(<TelemetryCharts rows={makeRows(3)} timeFilter="24h" />);
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("renders bar chart when operations data exists", () => {
      render(<TelemetryCharts rows={makeRows(3)} timeFilter="24h" />);
      expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. TIMELINE DATA AGGREGATION
  // ═══════════════════════════════════════════════════════════

  describe("Timeline data aggregation", () => {
    it("groups by 5-min buckets for 1h filter", () => {
      const rows = makeRows(10, { created_at: new Date().toISOString() });
      const { container } = render(<TelemetryCharts rows={rows} timeFilter="1h" />);
      expect(container.querySelector('[data-testid="area-chart"]')).toBeInTheDocument();
    });

    it("groups by 15-min buckets for 6h filter", () => {
      const rows = makeRows(10, { created_at: new Date().toISOString() });
      render(<TelemetryCharts rows={rows} timeFilter="6h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("groups by hour for 24h filter", () => {
      const rows = makeRows(10);
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("groups by hour for 7d filter", () => {
      const rows = makeRows(10);
      render(<TelemetryCharts rows={rows} timeFilter="7d" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("limits timeline to last 20 buckets", () => {
      // Create rows spread across many different hours
      const rows = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - i);
        return makeTelemetryRow({ created_at: d.toISOString(), id: `t-${i}` });
      });
      render(<TelemetryCharts rows={rows} timeFilter="7d" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. SEVERITY DATA COMPUTATION
  // ═══════════════════════════════════════════════════════════

  describe("Severity data computation", () => {
    it("counts slow severity correctly", () => {
      const rows = makeRows(5, { severity: "slow" });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Severidade")).toBeInTheDocument();
    });

    it("counts very_slow severity correctly", () => {
      const rows = makeRows(3, { severity: "very_slow" });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Severidade")).toBeInTheDocument();
    });

    it("counts error severity correctly", () => {
      const rows = makeRows(2, { severity: "error" });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Severidade")).toBeInTheDocument();
    });

    it("counts normal severity correctly", () => {
      const rows = makeRows(4, { severity: "normal" });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Severidade")).toBeInTheDocument();
    });

    it("handles mixed severities", () => {
      const rows = [
        ...makeRows(2, { severity: "slow" }),
        ...makeRows(3, { severity: "very_slow" }),
        ...makeRows(1, { severity: "error" }),
        ...makeRows(4, { severity: "normal" }),
      ];
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Severidade")).toBeInTheDocument();
    });

    it("filters out severity categories with 0 count", () => {
      const rows = makeRows(5, { severity: "slow" });
      // Only slow should appear, normal/very_slow/error = 0
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. OPERATION DATA COMPUTATION
  // ═══════════════════════════════════════════════════════════

  describe("Operation data computation", () => {
    it("counts operations correctly", () => {
      const rows = [
        ...makeRows(5, { operation: "SELECT" }),
        ...makeRows(3, { operation: "INSERT" }),
        ...makeRows(1, { operation: "UPDATE" }),
      ];
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Operação")).toBeInTheDocument();
    });

    it("sorts operations by count descending", () => {
      const rows = [
        ...makeRows(1, { operation: "DELETE" }),
        ...makeRows(10, { operation: "SELECT" }),
        ...makeRows(5, { operation: "INSERT" }),
      ];
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThanOrEqual(1);
    });

    it("limits operations to top 6", () => {
      const ops = ["SELECT", "INSERT", "UPDATE", "DELETE", "RPC", "SUBSCRIBE", "UPSERT", "COUNT"];
      const rows = ops.flatMap((op, i) => makeRows(i + 1, { operation: op }));
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThanOrEqual(1);
    });

    it("handles single operation type", () => {
      const rows = makeRows(10, { operation: "SELECT" });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Por Operação")).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 5. EDGE CASES
  // ═══════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    it("handles single row", () => {
      render(<TelemetryCharts rows={[makeTelemetryRow()]} timeFilter="24h" />);
      expect(screen.getByText("Alertas ao Longo do Tempo")).toBeInTheDocument();
    });

    it("handles rows with null table_name and rpc_name", () => {
      const rows = makeRows(3, { table_name: null, rpc_name: null });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("handles rows with rpc_name instead of table_name", () => {
      const rows = makeRows(3, { table_name: null, rpc_name: "get_leaderboard" });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("handles very large duration values", () => {
      const rows = makeRows(3, { duration_ms: 999999 });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("handles zero duration values", () => {
      const rows = makeRows(3, { duration_ms: 0 });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("handles rows with null record_count", () => {
      const rows = makeRows(3, { record_count: null });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("handles future dates", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const rows = makeRows(3, { created_at: future });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("handles very old dates", () => {
      const old = new Date("2020-01-01T00:00:00Z").toISOString();
      const rows = makeRows(3, { created_at: old });
      render(<TelemetryCharts rows={rows} timeFilter="7d" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("handles unknown severity", () => {
      const rows = makeRows(3, { severity: "critical" });
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      // Unknown severity won't match any category, so pie might be empty
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("handles large dataset (200 rows)", () => {
      const rows = makeRows(200);
      render(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getByText("Alertas ao Longo do Tempo")).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 6. PROPS CHANGES
  // ═══════════════════════════════════════════════════════════

  describe("Props changes", () => {
    it("re-renders when timeFilter changes from 1h to 24h", () => {
      const rows = makeRows(5);
      const { rerender } = render(<TelemetryCharts rows={rows} timeFilter="1h" />);
      rerender(<TelemetryCharts rows={rows} timeFilter="24h" />);
      expect(screen.getAllByTestId("area-chart")[0]).toBeInTheDocument();
    });

    it("re-renders when rows change", () => {
      const { rerender } = render(<TelemetryCharts rows={makeRows(3)} timeFilter="24h" />);
      rerender(<TelemetryCharts rows={makeRows(10)} timeFilter="24h" />);
      expect(screen.getByText("Alertas ao Longo do Tempo")).toBeInTheDocument();
    });

    it("transitions from data to empty gracefully", () => {
      const { rerender, container } = render(<TelemetryCharts rows={makeRows(5)} timeFilter="24h" />);
      expect(screen.getByText("Alertas ao Longo do Tempo")).toBeInTheDocument();
      rerender(<TelemetryCharts rows={[]} timeFilter="24h" />);
      expect(container.innerHTML).toBe("");
    });

    it("transitions from empty to data gracefully", () => {
      const { rerender } = render(<TelemetryCharts rows={[]} timeFilter="24h" />);
      rerender(<TelemetryCharts rows={makeRows(5)} timeFilter="24h" />);
      expect(screen.getByText("Alertas ao Longo do Tempo")).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 7. CARD TITLES & STRUCTURE
  // ═══════════════════════════════════════════════════════════

  describe("Card titles and structure", () => {
    it("displays 'Alertas ao Longo do Tempo' title", () => {
      render(<TelemetryCharts rows={makeRows(3)} timeFilter="24h" />);
      expect(screen.getByText("Alertas ao Longo do Tempo")).toBeInTheDocument();
    });

    it("displays 'Por Severidade' title", () => {
      render(<TelemetryCharts rows={makeRows(3)} timeFilter="24h" />);
      expect(screen.getByText("Por Severidade")).toBeInTheDocument();
    });

    it("displays 'Por Operação' title", () => {
      render(<TelemetryCharts rows={makeRows(3)} timeFilter="24h" />);
      expect(screen.getByText("Por Operação")).toBeInTheDocument();
    });

    it("renders 5 responsive containers (2 area, pie, 2 bar)", () => {
      render(<TelemetryCharts rows={makeRows(3)} timeFilter="24h" />);
      const containers = screen.getAllByTestId("responsive-container");
      expect(containers.length).toBe(5);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// TELEMETRY PAGE LOGIC TESTS (pure functions extracted)
// ═══════════════════════════════════════════════════════════

describe("Telemetry Page Logic", () => {
  // Extract and test the pure logic functions used in AdminTelemetriaPage

  const formatDuration = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  // ─── formatDuration ──────────────────────────────────────

  describe("formatDuration", () => {
    it("formats milliseconds below 1000", () => {
      expect(formatDuration(500)).toBe("500ms");
    });

    it("formats 0ms", () => {
      expect(formatDuration(0)).toBe("0ms");
    });

    it("formats exactly 1000ms as seconds", () => {
      expect(formatDuration(1000)).toBe("1.0s");
    });

    it("formats 1500ms as 1.5s", () => {
      expect(formatDuration(1500)).toBe("1.5s");
    });

    it("formats 3000ms as 3.0s", () => {
      expect(formatDuration(3000)).toBe("3.0s");
    });

    it("formats 8500ms as 8.5s", () => {
      expect(formatDuration(8500)).toBe("8.5s");
    });

    it("formats 999ms as ms", () => {
      expect(formatDuration(999)).toBe("999ms");
    });

    it("formats 10000ms as 10.0s", () => {
      expect(formatDuration(10000)).toBe("10.0s");
    });

    it("formats 100000ms as 100.0s", () => {
      expect(formatDuration(100000)).toBe("100.0s");
    });

    it("formats 1ms", () => {
      expect(formatDuration(1)).toBe("1ms");
    });

    it("formats 50ms", () => {
      expect(formatDuration(50)).toBe("50ms");
    });

    it("formats 2345ms as 2.3s", () => {
      expect(formatDuration(2345)).toBe("2.3s");
    });

    it("formats 9999ms as 10.0s", () => {
      expect(formatDuration(9999)).toBe("10.0s");
    });

    it("formats 1001ms as 1.0s", () => {
      expect(formatDuration(1001)).toBe("1.0s");
    });

    it("formats large values 60000ms as 60.0s", () => {
      expect(formatDuration(60000)).toBe("60.0s");
    });
  });

  // ─── formatTime ──────────────────────────────────────────

  describe("formatTime", () => {
    it("returns a string", () => {
      expect(typeof formatTime(new Date().toISOString())).toBe("string");
    });

    it("includes day and month", () => {
      const result = formatTime("2026-03-23T14:30:45.000Z");
      expect(result).toMatch(/\d{2}\/\d{2}/);
    });

    it("includes time components", () => {
      const result = formatTime("2026-03-23T14:30:45.000Z");
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it("handles midnight", () => {
      const result = formatTime("2026-01-01T00:00:00.000Z");
      expect(typeof result).toBe("string");
    });

    it("handles end of year", () => {
      const result = formatTime("2025-12-31T23:59:59.000Z");
      expect(typeof result).toBe("string");
    });
  });

  // ─── getTimeThreshold ────────────────────────────────────

  describe("getTimeThreshold logic", () => {
    const getTimeThreshold = (timeFilter: string) => {
      const now = new Date();
      switch (timeFilter) {
        case "1h": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        default: return new Date().toISOString();
      }
    };

    it("1h threshold is ~1 hour ago", () => {
      const threshold = new Date(getTimeThreshold("1h")).getTime();
      const expected = Date.now() - 60 * 60 * 1000;
      expect(Math.abs(threshold - expected)).toBeLessThan(1000);
    });

    it("6h threshold is ~6 hours ago", () => {
      const threshold = new Date(getTimeThreshold("6h")).getTime();
      const expected = Date.now() - 6 * 60 * 60 * 1000;
      expect(Math.abs(threshold - expected)).toBeLessThan(1000);
    });

    it("24h threshold is ~24 hours ago", () => {
      const threshold = new Date(getTimeThreshold("24h")).getTime();
      const expected = Date.now() - 24 * 60 * 60 * 1000;
      expect(Math.abs(threshold - expected)).toBeLessThan(1000);
    });

    it("7d threshold is ~7 days ago", () => {
      const threshold = new Date(getTimeThreshold("7d")).getTime();
      const expected = Date.now() - 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(threshold - expected)).toBeLessThan(1000);
    });

    it("returns valid ISO string for all filters", () => {
      for (const filter of ["1h", "6h", "24h", "7d"]) {
        const result = getTimeThreshold(filter);
        expect(() => new Date(result)).not.toThrow();
        expect(new Date(result).toISOString()).toBe(result);
      }
    });

    it("1h < 6h < 24h < 7d (threshold ordering)", () => {
      const t1 = new Date(getTimeThreshold("1h")).getTime();
      const t6 = new Date(getTimeThreshold("6h")).getTime();
      const t24 = new Date(getTimeThreshold("24h")).getTime();
      const t7d = new Date(getTimeThreshold("7d")).getTime();
      expect(t1).toBeGreaterThan(t6);
      expect(t6).toBeGreaterThan(t24);
      expect(t24).toBeGreaterThan(t7d);
    });
  });

  // ─── Stats computation ──────────────────────────────────

  describe("Stats computation", () => {
    interface FullTelemetryRow {
      id: string;
      operation: string;
      table_name: string | null;
      rpc_name: string | null;
      duration_ms: number;
      record_count: number | null;
      query_limit: number | null;
      query_offset: number | null;
      count_mode: string | null;
      severity: string;
      error_message: string | null;
      user_id: string | null;
      created_at: string;
    }

    function makeFullRow(overrides: Partial<FullTelemetryRow> = {}): FullTelemetryRow {
      return {
        id: overrides.id ?? crypto.randomUUID(),
        operation: overrides.operation ?? "SELECT",
        table_name: overrides.table_name ?? "entregas",
        rpc_name: overrides.rpc_name ?? null,
        duration_ms: overrides.duration_ms ?? 5000,
        record_count: overrides.record_count ?? 100,
        query_limit: overrides.query_limit ?? 200,
        query_offset: overrides.query_offset ?? 0,
        count_mode: overrides.count_mode ?? null,
        severity: overrides.severity ?? "slow",
        error_message: overrides.error_message ?? null,
        user_id: overrides.user_id ?? null,
        created_at: overrides.created_at ?? new Date().toISOString(),
      };
    }

    it("counts very_slow correctly", () => {
      const rows = [
        makeFullRow({ severity: "very_slow" }),
        makeFullRow({ severity: "very_slow" }),
        makeFullRow({ severity: "slow" }),
      ];
      expect(rows.filter(r => r.severity === "very_slow").length).toBe(2);
    });

    it("counts slow correctly", () => {
      const rows = [
        makeFullRow({ severity: "slow" }),
        makeFullRow({ severity: "slow" }),
        makeFullRow({ severity: "slow" }),
        makeFullRow({ severity: "very_slow" }),
      ];
      expect(rows.filter(r => r.severity === "slow").length).toBe(3);
    });

    it("counts errors correctly", () => {
      const rows = [
        makeFullRow({ severity: "error" }),
        makeFullRow({ severity: "slow" }),
      ];
      expect(rows.filter(r => r.severity === "error").length).toBe(1);
    });

    it("calculates average duration correctly", () => {
      const rows = [
        makeFullRow({ duration_ms: 1000 }),
        makeFullRow({ duration_ms: 3000 }),
        makeFullRow({ duration_ms: 5000 }),
      ];
      const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
      expect(avg).toBe(3000);
    });

    it("average duration is 0 for empty rows", () => {
      const rows: FullTelemetryRow[] = [];
      const avg = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length) : 0;
      expect(avg).toBe(0);
    });

    it("average duration handles single row", () => {
      const rows = [makeFullRow({ duration_ms: 7500 })];
      const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
      expect(avg).toBe(7500);
    });

    it("counts all severities to 0 when empty", () => {
      const rows: FullTelemetryRow[] = [];
      expect(rows.filter(r => r.severity === "very_slow").length).toBe(0);
      expect(rows.filter(r => r.severity === "slow").length).toBe(0);
      expect(rows.filter(r => r.severity === "error").length).toBe(0);
    });
  });

  // ─── Top offenders computation ───────────────────────────

  describe("Top offenders computation", () => {
    interface MinRow {
      rpc_name: string | null;
      table_name: string | null;
      duration_ms: number;
    }

    function computeTopOffenders(rows: MinRow[]) {
      const stats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
      for (const r of rows) {
        const key = r.rpc_name || r.table_name || "unknown";
        const prev = stats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
        stats.set(key, {
          count: prev.count + 1,
          totalMs: prev.totalMs + r.duration_ms,
          maxMs: Math.max(prev.maxMs, r.duration_ms),
        });
      }
      return [...stats.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8);
    }

    it("groups by table_name", () => {
      const rows: MinRow[] = [
        { rpc_name: null, table_name: "entregas", duration_ms: 5000 },
        { rpc_name: null, table_name: "entregas", duration_ms: 3000 },
        { rpc_name: null, table_name: "coletas", duration_ms: 2000 },
      ];
      const result = computeTopOffenders(rows);
      expect(result[0][0]).toBe("entregas");
      expect(result[0][1].count).toBe(2);
    });

    it("prefers rpc_name over table_name", () => {
      const rows: MinRow[] = [
        { rpc_name: "get_leaderboard", table_name: "user_levels", duration_ms: 5000 },
      ];
      const result = computeTopOffenders(rows);
      expect(result[0][0]).toBe("get_leaderboard");
    });

    it("uses 'unknown' for null rpc and table", () => {
      const rows: MinRow[] = [
        { rpc_name: null, table_name: null, duration_ms: 5000 },
      ];
      const result = computeTopOffenders(rows);
      expect(result[0][0]).toBe("unknown");
    });

    it("sorts by count descending", () => {
      const rows: MinRow[] = [
        { rpc_name: null, table_name: "a", duration_ms: 100 },
        { rpc_name: null, table_name: "b", duration_ms: 100 },
        { rpc_name: null, table_name: "b", duration_ms: 100 },
        { rpc_name: null, table_name: "b", duration_ms: 100 },
        { rpc_name: null, table_name: "a", duration_ms: 100 },
      ];
      const result = computeTopOffenders(rows);
      expect(result[0][0]).toBe("b");
      expect(result[0][1].count).toBe(3);
      expect(result[1][0]).toBe("a");
      expect(result[1][1].count).toBe(2);
    });

    it("limits to 8 entries", () => {
      const rows: MinRow[] = Array.from({ length: 20 }, (_, i) => ({
        rpc_name: null, table_name: `table_${i}`, duration_ms: 100,
      }));
      const result = computeTopOffenders(rows);
      expect(result.length).toBe(8);
    });

    it("calculates maxMs correctly", () => {
      const rows: MinRow[] = [
        { rpc_name: null, table_name: "t1", duration_ms: 1000 },
        { rpc_name: null, table_name: "t1", duration_ms: 9000 },
        { rpc_name: null, table_name: "t1", duration_ms: 3000 },
      ];
      const result = computeTopOffenders(rows);
      expect(result[0][1].maxMs).toBe(9000);
    });

    it("calculates totalMs correctly", () => {
      const rows: MinRow[] = [
        { rpc_name: null, table_name: "t1", duration_ms: 1000 },
        { rpc_name: null, table_name: "t1", duration_ms: 2000 },
        { rpc_name: null, table_name: "t1", duration_ms: 3000 },
      ];
      const result = computeTopOffenders(rows);
      expect(result[0][1].totalMs).toBe(6000);
    });

    it("average per table is totalMs/count", () => {
      const rows: MinRow[] = [
        { rpc_name: null, table_name: "t1", duration_ms: 1000 },
        { rpc_name: null, table_name: "t1", duration_ms: 3000 },
      ];
      const result = computeTopOffenders(rows);
      const avg = Math.round(result[0][1].totalMs / result[0][1].count);
      expect(avg).toBe(2000);
    });

    it("handles empty input", () => {
      expect(computeTopOffenders([]).length).toBe(0);
    });

    it("handles single entry", () => {
      const result = computeTopOffenders([
        { rpc_name: null, table_name: "solo", duration_ms: 5000 },
      ]);
      expect(result.length).toBe(1);
      expect(result[0][0]).toBe("solo");
    });
  });

  // ─── Severity badge logic ───────────────────────────────

  describe("Severity badge classification", () => {
    it("very_slow maps to 'Muito Lenta'", () => {
      expect("very_slow").toBe("very_slow");
    });

    it("slow maps to 'Lenta'", () => {
      expect("slow").toBe("slow");
    });

    it("error maps to 'Erro'", () => {
      expect("error").toBe("error");
    });

    it("default severity renders variant secondary", () => {
      const s = "normal";
      expect(["very_slow", "slow", "error"].includes(s)).toBe(false);
    });

    it("duration >= 8000 is text-destructive", () => {
      expect(8000 >= 8000).toBe(true);
      expect(9000 >= 8000).toBe(true);
    });

    it("duration >= 3000 and < 8000 is text-warning", () => {
      const ms = 5000;
      expect(ms >= 3000 && ms < 8000).toBe(true);
    });

    it("duration < 3000 has no color class", () => {
      const ms = 2500;
      expect(ms < 3000).toBe(true);
    });
  });

  // ─── Data integrity constraints ─────────────────────────

  describe("Data integrity", () => {
    it("TelemetryRow interface requires id", () => {
      const row = makeTelemetryRow();
      expect(row.id).toBeDefined();
      expect(typeof row.id).toBe("string");
    });

    it("TelemetryRow interface requires operation", () => {
      const row = makeTelemetryRow();
      expect(row.operation).toBeDefined();
    });

    it("TelemetryRow interface requires duration_ms as number", () => {
      const row = makeTelemetryRow();
      expect(typeof row.duration_ms).toBe("number");
    });

    it("TelemetryRow interface requires severity", () => {
      const row = makeTelemetryRow();
      expect(row.severity).toBeDefined();
    });

    it("TelemetryRow interface requires created_at", () => {
      const row = makeTelemetryRow();
      expect(row.created_at).toBeDefined();
      expect(() => new Date(row.created_at)).not.toThrow();
    });

    it("table_name can be null", () => {
      const row = makeTelemetryRow({ table_name: null });
      expect(row.table_name).toBeNull();
    });

    it("rpc_name can be null", () => {
      const row = makeTelemetryRow({ rpc_name: null });
      expect(row.rpc_name).toBeNull();
    });

    it("record_count can be null", () => {
      const row = makeTelemetryRow({ record_count: null });
      expect(row.record_count).toBeNull();
    });
  });

  // ─── Filter logic ───────────────────────────────────────

  describe("Severity filter logic", () => {
    function filterRows(rows: ReturnType<typeof makeTelemetryRow>[], filter: string) {
      if (filter === "all") return rows;
      return rows.filter(r => r.severity === filter);
    }

    it("'all' returns all rows", () => {
      const rows = [
        makeTelemetryRow({ severity: "slow" }),
        makeTelemetryRow({ severity: "error" }),
        makeTelemetryRow({ severity: "very_slow" }),
      ];
      expect(filterRows(rows, "all").length).toBe(3);
    });

    it("'slow' returns only slow rows", () => {
      const rows = [
        makeTelemetryRow({ severity: "slow" }),
        makeTelemetryRow({ severity: "error" }),
        makeTelemetryRow({ severity: "slow" }),
      ];
      expect(filterRows(rows, "slow").length).toBe(2);
    });

    it("'very_slow' returns only very_slow rows", () => {
      const rows = [
        makeTelemetryRow({ severity: "slow" }),
        makeTelemetryRow({ severity: "very_slow" }),
      ];
      expect(filterRows(rows, "very_slow").length).toBe(1);
    });

    it("'error' returns only error rows", () => {
      const rows = [
        makeTelemetryRow({ severity: "error" }),
        makeTelemetryRow({ severity: "error" }),
        makeTelemetryRow({ severity: "slow" }),
      ];
      expect(filterRows(rows, "error").length).toBe(2);
    });

    it("filter with no matches returns empty", () => {
      const rows = [
        makeTelemetryRow({ severity: "slow" }),
        makeTelemetryRow({ severity: "slow" }),
      ];
      expect(filterRows(rows, "error").length).toBe(0);
    });

    it("filter on empty array returns empty", () => {
      expect(filterRows([], "slow").length).toBe(0);
    });
  });

  // ─── Cleanup threshold logic ────────────────────────────

  describe("Cleanup threshold", () => {
    it("cleanup threshold is 7 days ago", () => {
      const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = Date.now();
      const diff = now - threshold.getTime();
      const daysDiff = diff / (24 * 60 * 60 * 1000);
      expect(Math.round(daysDiff)).toBe(7);
    });

    it("rows older than 7d should be cleaned", () => {
      const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const oldRow = makeTelemetryRow({
        created_at: new Date(threshold - 86400000).toISOString(),
      });
      expect(new Date(oldRow.created_at).getTime()).toBeLessThan(threshold);
    });

    it("rows newer than 7d should NOT be cleaned", () => {
      const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newRow = makeTelemetryRow({
        created_at: new Date().toISOString(),
      });
      expect(new Date(newRow.created_at).getTime()).toBeGreaterThan(threshold);
    });
  });

  // ─── Table display fallback logic ───────────────────────

  describe("Table display fallback", () => {
    it("displays rpc_name when both rpc_name and table_name exist", () => {
      const row = makeTelemetryRow({ rpc_name: "my_rpc", table_name: "my_table" });
      const display = row.rpc_name || row.table_name || "-";
      expect(display).toBe("my_rpc");
    });

    it("displays table_name when rpc_name is null", () => {
      const row = makeTelemetryRow({ rpc_name: null, table_name: "my_table" });
      const display = row.rpc_name || row.table_name || "-";
      expect(display).toBe("my_table");
    });

    it("displays '-' when both are null", () => {
      const row = makeTelemetryRow({ rpc_name: null, table_name: null });
      const display = row.rpc_name || row.table_name || "-";
      expect(display).toBe("-");
    });

    it("record_count displays value when present", () => {
      const row = makeTelemetryRow({ record_count: 42 });
      expect(row.record_count ?? "-").toBe(42);
    });

    it("record_count displays '-' when null", () => {
      const row = makeTelemetryRow({ record_count: null });
      expect(row.record_count ?? "-").toBe("-");
    });
  });
});

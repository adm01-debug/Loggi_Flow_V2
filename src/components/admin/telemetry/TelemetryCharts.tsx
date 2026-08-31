import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp, Timer, Database } from "lucide-react";

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  record_count: number | null;
  severity: string;
  created_at: string;
}

interface TelemetryChartsProps {
  rows: TelemetryRow[];
  timeFilter: string;
}

function getBucketMs(timeFilter: string): number {
  switch (timeFilter) {
    case "1h": return 5 * 60 * 1000;
    case "6h": return 30 * 60 * 1000;
    case "24h": return 60 * 60 * 1000;
    default: return 6 * 60 * 60 * 1000;
  }
}

function formatBucketTime(ts: number, timeFilter: string): string {
  const d = new Date(ts);
  if (timeFilter === "7d" || timeFilter === "custom") {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function TelemetryCharts({ rows, timeFilter }: TelemetryChartsProps) {
  // Timeline: stacked alerts by severity
  const timelineData = useMemo(() => {
    if (rows.length === 0) return [];
    const bucketMs = getBucketMs(timeFilter);
    const buckets = new Map<number, { muitoLentas: number; lentas: number; erros: number }>();

    for (const r of rows) {
      const ts = new Date(r.created_at).getTime();
      const key = Math.floor(ts / bucketMs) * bucketMs;
      const prev = buckets.get(key) || { muitoLentas: 0, lentas: 0, erros: 0 };
      if (r.severity === "very_slow") prev.muitoLentas++;
      else if (r.severity === "slow") prev.lentas++;
      else if (r.severity === "error") prev.erros++;
      buckets.set(key, prev);
    }

    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ts, v]) => ({
        time: formatBucketTime(ts, timeFilter),
        ...v,
      }));
  }, [rows, timeFilter]);

  // Duration chart: avg and max per bucket
  const durationData = useMemo(() => {
    if (rows.length === 0) return [];
    const bucketMs = getBucketMs(timeFilter);
    const buckets = new Map<number, { totalMs: number; maxMs: number; count: number }>();

    for (const r of rows) {
      const ts = new Date(r.created_at).getTime();
      const key = Math.floor(ts / bucketMs) * bucketMs;
      const prev = buckets.get(key) || { totalMs: 0, maxMs: 0, count: 0 };
      buckets.set(key, {
        totalMs: prev.totalMs + r.duration_ms,
        maxMs: Math.max(prev.maxMs, r.duration_ms),
        count: prev.count + 1,
      });
    }

    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ts, v]) => ({
        time: formatBucketTime(ts, timeFilter),
        mediaMs: Math.round(v.totalMs / v.count),
        maxMs: v.maxMs,
      }));
  }, [rows, timeFilter]);

  // Severity pie
  const severityData = useMemo(() => {
    const counts = { slow: 0, very_slow: 0, error: 0 };
    for (const r of rows) {
      if (r.severity in counts) counts[r.severity as keyof typeof counts]++;
    }
    return [
      { name: "Lenta", value: counts.slow, color: "hsl(45, 93%, 47%)" },
      { name: "Muito Lenta", value: counts.very_slow, color: "hsl(var(--destructive))" },
      { name: "Erro", value: counts.error, color: "hsl(0, 84%, 40%)" },
    ].filter(d => d.value > 0);
  }, [rows]);

  // Top tables horizontal bar
  const tableData = useMemo(() => {
    const stats = new Map<string, number>();
    for (const r of rows) {
      const key = r.rpc_name || r.table_name || "unknown";
      stats.set(key, (stats.get(key) || 0) + 1);
    }
    return [...stats.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, alertas]) => ({ name, alertas }));
  }, [rows]);

  // Operations bar
  const operationData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      counts.set(r.operation, (counts.get(r.operation) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [rows]);

  if (rows.length === 0) return null;

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Timeline + Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stacked Alert Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Alertas ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="muitoLentas" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Muito Lentas" />
                <Area type="monotone" dataKey="lentas" stackId="1" stroke="hsl(45, 93%, 47%)" fill="hsl(45, 93%, 47%)" fillOpacity={0.6} name="Lentas" />
                <Area type="monotone" dataKey="erros" stackId="1" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.6} name="Erros" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Duration Avg/Max */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Duração Média / Máxima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}s` : `${v}ms`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`} />
                <Area type="monotone" dataKey="maxMs" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} name="Máxima" />
                <Area type="monotone" dataKey="mediaMs" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Média" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Severity Pie + Table Bar + Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Severity Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4" />
              Por Severidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table Alerts Horizontal Bar */}
        {tableData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Alertas por Tabela
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tableData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="alertas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Alertas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Operations Bar */}
        {operationData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Por Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={operationData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

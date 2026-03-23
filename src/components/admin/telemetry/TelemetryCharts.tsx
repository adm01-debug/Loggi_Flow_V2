import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";

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

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(45, 93%, 47%)",
  "hsl(142, 76%, 36%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
];

export function TelemetryCharts({ rows, timeFilter }: TelemetryChartsProps) {
  const timelineData = useMemo(() => {
    if (rows.length === 0) return [];
    const buckets = new Map<string, { count: number; avgMs: number; totalMs: number }>();
    const format = timeFilter === "1h" || timeFilter === "6h" ? "HH:mm" : "DD/MM HH:mm";

    for (const r of rows) {
      const d = new Date(r.created_at);
      let key: string;
      if (timeFilter === "1h") {
        d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
        key = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      } else if (timeFilter === "6h") {
        d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
        key = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      } else {
        d.setMinutes(0, 0, 0);
        key = d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      }
      const prev = buckets.get(key) || { count: 0, avgMs: 0, totalMs: 0 };
      buckets.set(key, { count: prev.count + 1, totalMs: prev.totalMs + r.duration_ms, avgMs: 0 });
    }

    return [...buckets.entries()]
      .map(([time, v]) => ({ time, count: v.count, avgMs: Math.round(v.totalMs / v.count) }))
      .slice(-20);
  }, [rows, timeFilter]);

  const severityData = useMemo(() => {
    const counts = { slow: 0, very_slow: 0, error: 0, normal: 0 };
    for (const r of rows) {
      if (r.severity in counts) counts[r.severity as keyof typeof counts]++;
    }
    return [
      { name: "Normal", value: counts.normal, color: "hsl(var(--primary))" },
      { name: "Lenta", value: counts.slow, color: "hsl(45, 93%, 47%)" },
      { name: "Muito Lenta", value: counts.very_slow, color: "hsl(var(--destructive))" },
      { name: "Erro", value: counts.error, color: "hsl(0, 84%, 40%)" },
    ].filter(d => d.value > 0);
  }, [rows]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Queries ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [name === "avgMs" ? `${value}ms` : value, name === "avgMs" ? "Média (ms)" : "Alertas"]}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Alertas" />
              <Line type="monotone" dataKey="avgMs" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Média (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Severity Pie */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PieIcon className="h-4 w-4" />
            Por Severidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Operations Bar */}
      {operationData.length > 0 && (
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Por Tipo de Operação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={operationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

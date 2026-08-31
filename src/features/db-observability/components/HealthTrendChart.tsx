import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { useHealthSnapshots } from "../hooks/useHealthSnapshots";

export function HealthTrendChart() {
  const { data, isLoading } = useHealthSnapshots(7);

  const rows = (data ?? []).map((s) => ({
    t: format(new Date(s.created_at), "dd/MM HH:mm"),
    conexoes: s.active_connections ?? 0,
    cache: s.cache_hit_ratio != null ? Number(s.cache_hit_ratio) * 100 : null,
    deadlocks: s.deadlocks ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Tendência de Saúde (7 dias)
        </CardTitle>
        <CardDescription>
          Snapshots horários de conexões, cache hit ratio e deadlocks.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ainda sem snapshots — o cron horário começa a preencher em breve.
          </p>
        )}
        {rows.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="conexoes"
                stroke="hsl(var(--primary))"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cache"
                stroke="hsl(var(--success, 142 76% 36%))"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="deadlocks"
                stroke="hsl(var(--destructive))"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

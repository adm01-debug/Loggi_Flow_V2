import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { useHealthScoreHistory } from "../hooks/useHealthScoreHistory";

export function HealthScoreHistoryChart() {
  const { data, isLoading, error } = useHealthScoreHistory(30);

  const chartData = (data ?? []).map((p) => ({
    date: new Date(p.captured_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Global: Number(p.overall_score),
    SLO: Number(p.slo_score),
    Anomalias: Number(p.anomaly_score),
    MTTR: Number(p.mttr_score),
    Capacidade: Number(p.capacity_score),
  }));

  return (
    <Card className="card-raised">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendência do Health Score (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-72 w-full" />}
        {error && <p className="text-sm text-destructive">Erro ao carregar histórico.</p>}
        {!isLoading && chartData.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ainda sem snapshots. O primeiro será capturado no próximo cron (06:00 UTC).
          </p>
        )}
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="Global" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="SLO" stroke="hsl(var(--chart-2, 200 70% 50%))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Anomalias" stroke="hsl(var(--chart-3, 30 80% 55%))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="MTTR" stroke="hsl(var(--chart-4, 280 60% 55%))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Capacidade" stroke="hsl(var(--chart-5, 340 70% 55%))" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

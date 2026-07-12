import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { useSloDaily } from "../hooks/useSloDaily";

export function SloTrendCard() {
  const { data, isLoading } = useSloDaily(30);

  const rows = (data ?? []).map((s) => ({
    day: format(new Date(s.day), "dd/MM"),
    slo: Number(s.overall_slo_pct),
  }));

  const latest = rows[rows.length - 1]?.slo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          SLO Diário (30d)
        </CardTitle>
        <CardDescription>
          Média de conformidade em conexões, cache e ausência de deadlocks.
          {latest != null && (
            <span className="ml-2 font-medium text-foreground">
              Hoje: {latest.toFixed(1)}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aguardando primeiro rollup diário (03:15 UTC).
          </p>
        )}
        {rows.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <ReferenceLine y={99} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
              <Bar dataKey="slo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

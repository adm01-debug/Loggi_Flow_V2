import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePredictionAccuracyDaily } from "@/hooks/logistics/usePredictionAccuracyDaily";

export function PredictionAccuracyTimeline() {
  const { data, isLoading } = usePredictionAccuracyDaily();

  const chartData = (data ?? []).map((row) => ({
    dia: format(parseISO(row.dia), "dd/MM", { locale: ptBR }),
    acuracia: row.acuracia_pct ?? 0,
    confirmadas: row.total_confirmadas,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Acurácia das Predições (30d)</CardTitle>
        </div>
        <CardDescription>Evolução diária da taxa de acerto da IA</CardDescription>
      </CardHeader>
      <CardContent>
        {(() => {
          if (isLoading) {
            return <div className="h-[240px] w-full bg-muted/30 rounded animate-pulse" />;
          }
          if (chartData.length === 0) {
            return (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                Ainda não há predições confirmadas suficientes para exibir a série temporal.
              </div>
            );
          }
          return (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name) =>
                    name === "acuracia" ? [`${value}%`, "Acurácia"] : [value, "Confirmadas"]
                  }
                />
                <Line
                  type="monotone"
                  dataKey="acuracia"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
      </CardContent>
    </Card>
  );
}

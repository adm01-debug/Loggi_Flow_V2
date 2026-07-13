import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useCapacityForecast } from "../hooks/useCapacityForecast";

function variant(s: string): "destructive" | "secondary" | "default" {
  if (s === "critical") return "destructive";
  if (s === "warning") return "secondary";
  return "default";
}

const formatEta = (h: number | null): string => {
  if (h === null || h === undefined) return "estável / decrescente";
  if (h <= 0) return "limite já atingido";
  if (h < 48) return `~${h.toFixed(1)}h`;
  return `~${(h / 24).toFixed(1)}d`;
};

export function CapacityForecastCard() {
  const { data, isLoading, error } = useCapacityForecast(168);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Forecast de Capacidade (7d)
        </CardTitle>
        <CardDescription>
          Regressão linear sobre snapshots — projeção para os próximos 7 dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Calculando tendência…</p>}
        {error && <p className="text-sm text-destructive">Erro ao gerar forecast.</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Snapshots insuficientes (mínimo 3 nas últimas 7d).
          </p>
        )}
        {data?.map((f) => (
          <div
            key={f.metric}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium">{f.metric}</p>
              <p className="text-xs text-muted-foreground">
                atual {Number(f.current_value).toFixed(2)} · projetado{" "}
                {Number(f.forecast_value).toFixed(2)} · limite {Number(f.threshold).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">
                ETA até limite: {formatEta(f.hours_until_threshold as number | null)}
              </p>
            </div>
            <Badge variant={variant(f.severity)}>{f.severity}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

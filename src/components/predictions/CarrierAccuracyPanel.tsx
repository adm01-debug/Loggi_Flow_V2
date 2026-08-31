import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCarrierAccuracy } from "@/hooks/logistics/useCarrierAccuracy";

function trendIcon(acuracia: number | null) {
  if (acuracia === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (acuracia >= 80) return <TrendingUp className="h-3 w-3 text-success" />;
  if (acuracia >= 60) return <Minus className="h-3 w-3 text-warning" />;
  return <TrendingDown className="h-3 w-3 text-destructive" />;
}

function progressColor(acuracia: number | null): "default" | "success" | "warning" | "danger" {
  if (acuracia === null) return "default";
  if (acuracia >= 80) return "success";
  if (acuracia >= 60) return "warning";
  return "danger";
}

export function CarrierAccuracyPanel() {
  const { data, isLoading } = useCarrierAccuracy();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="h-5 w-5 text-primary" />
          Acurácia por Transportadora (30d)
        </CardTitle>
        <CardDescription>
          Performance do modelo de predição segmentado por transportadora — auto-calibração
          ativa por transportadora
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Ainda não há predições confirmadas para calcular acurácia por transportadora.
          </p>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((carrier) => (
              <div
                key={carrier.transportadora}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {trendIcon(carrier.acuraciaPercentual)}
                    <span className="font-medium text-sm truncate">
                      {carrier.transportadora}
                    </span>
                  </div>
                  <Badge variant="outline" className="tabular-nums text-xs">
                    {carrier.acuraciaPercentual ?? "—"}%
                  </Badge>
                </div>
                <Progress
                  value={carrier.acuraciaPercentual ?? 0}
                  color={progressColor(carrier.acuraciaPercentual)}
                  className="h-1.5"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {carrier.totalConfirmadas} de {carrier.totalPredicoes} confirmadas
                  </span>
                  {carrier.desvioMedioHoras !== null && (
                    <span>desvio médio ±{carrier.desvioMedioHoras}h</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

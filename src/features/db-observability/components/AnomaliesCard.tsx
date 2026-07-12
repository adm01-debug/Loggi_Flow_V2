import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useHealthAnomalies } from "../hooks/useHealthAnomalies";

const severityVariant = (s: string): "destructive" | "secondary" | "default" =>
  s === "critical" ? "destructive" : s === "warning" ? "secondary" : "default";

export function AnomaliesCard() {
  const { data, isLoading, error } = useHealthAnomalies();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Anomalias Estatísticas (z-score 7d)
        </CardTitle>
        <CardDescription>
          Desvio da última leitura em relação à média das últimas 168h.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Analisando…</p>}
        {error && <p className="text-sm text-destructive">Erro ao calcular anomalias.</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem baseline suficiente ainda.</p>
        )}
        {data?.map((a) => (
          <div
            key={a.metric}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium">{a.metric}</p>
              <p className="text-xs text-muted-foreground">
                atual {Number(a.current_value).toFixed(2)} · média{" "}
                {Number(a.mean_value ?? 0).toFixed(2)} · z {Number(a.z_score).toFixed(2)}
              </p>
            </div>
            <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";
import { useRemediationMttr } from "../hooks/useRemediationMttr";

const fmtHours = (h: number | null): string => {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
};

const rateVariant = (pct: number | null): "default" | "secondary" | "destructive" => {
  if (pct == null) return "secondary";
  if (pct >= 80) return "default";
  if (pct >= 50) return "secondary";
  return "destructive";
};

export function MttrMetricsCard() {
  const { data, isLoading, error } = useRemediationMttr();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          MTTR por Categoria (30d)
        </CardTitle>
        <CardDescription>
          Tempo médio de resolução, taxa de conclusão e volume por tipo de sugestão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Calculando métricas…</p>}
        {error && <p className="text-sm text-destructive">Erro ao carregar MTTR.</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma remediação nos últimos 30 dias.
          </p>
        )}
        {data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Categoria</th>
                  <th className="pb-2 font-medium text-center">Aplicadas</th>
                  <th className="pb-2 font-medium text-center">Resolvidas</th>
                  <th className="pb-2 font-medium text-center">Pendentes</th>
                  <th className="pb-2 font-medium text-center">Taxa</th>
                  <th className="pb-2 font-medium text-center">MTTR</th>
                  <th className="pb-2 font-medium text-center">p50</th>
                  <th className="pb-2 font-medium text-center">p95</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.category} className="border-b border-border/50">
                    <td className="py-2 font-medium capitalize">{row.category}</td>
                    <td className="py-2 text-center">{row.total_applied}</td>
                    <td className="py-2 text-center text-green-600">{row.total_resolved}</td>
                    <td className="py-2 text-center text-amber-600">{row.total_pending}</td>
                    <td className="py-2 text-center">
                      <Badge variant={rateVariant(row.resolution_rate_pct)}>
                        {row.resolution_rate_pct != null
                          ? `${row.resolution_rate_pct}%`
                          : "—"}
                      </Badge>
                    </td>
                    <td className="py-2 text-center font-mono text-xs">
                      {fmtHours(row.mttr_hours)}
                    </td>
                    <td className="py-2 text-center font-mono text-xs text-muted-foreground">
                      {fmtHours(row.mttr_p50_hours)}
                    </td>
                    <td className="py-2 text-center font-mono text-xs text-muted-foreground">
                      {fmtHours(row.mttr_p95_hours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

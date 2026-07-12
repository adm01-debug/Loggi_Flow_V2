import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, Award, AlertTriangle, Zap } from "lucide-react";
import { useIndexRoi } from "../hooks/useIndexRoi";

function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export function IndexRoiCard() {
  const { data, isLoading, error } = useIndexRoi();

  return (
    <Card className="card-raised">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-emerald-600" />
          ROI dos Índices
        </CardTitle>
        <CardDescription>
          Impacto agregado de todas as propostas: eficácia, ganho médio e tempo economizado por execução.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}
        {error && <p className="text-sm text-destructive">Erro ao carregar ROI.</p>}
        {!isLoading && !data && (
          <p className="text-sm text-muted-foreground">Sem dados de ROI ainda.</p>
        )}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric
              label="Aplicados"
              value={String(data.total_applied)}
              hint={`${data.total_proposed} propostos`}
            />
            <Metric
              label="Efetivos (≥5%)"
              value={String(data.effective_indexes)}
              tone="positive"
              hint={`${data.ineffective_indexes} ineficazes`}
            />
            <Metric
              label="Ganho médio"
              value={data.avg_improvement_pct != null ? `${data.avg_improvement_pct}%` : "—"}
              tone={data.avg_improvement_pct && data.avg_improvement_pct > 0 ? "positive" : "default"}
              hint={`${data.measured_count} medidos`}
            />
            <Metric
              label="ms economizados/call"
              value={
                data.total_ms_saved_per_call != null
                  ? data.total_ms_saved_per_call.toFixed(1)
                  : "—"
              }
              tone="positive"
              hint="Soma por execução"
            />
            <div className="col-span-2 md:col-span-4 grid grid-cols-2 gap-3 mt-1">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-3">
                <Award className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Melhor ganho</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {data.best_improvement_pct != null ? `${data.best_improvement_pct}%` : "—"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Pior resultado</p>
                  <p className="text-lg font-semibold text-amber-600">
                    {data.worst_improvement_pct != null ? `${data.worst_improvement_pct}%` : "—"}
                  </p>
                </div>
              </div>
            </div>
            {data.total_reverted > 0 && (
              <div className="col-span-2 md:col-span-4 flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Zap className="h-3 w-3" />
                {data.total_reverted} índice(s) revertido(s) automaticamente por falta de ganho.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

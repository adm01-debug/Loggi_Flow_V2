/**
 * MitigationROIPanel — dashboard visual comparando delta OTIF por categoria.
 */
import { useMemo } from "react";
import { TrendingUp, Award, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useMitigationActions } from "@/hooks/predictions/useMitigationActions";
import { computeROI, type MitigationRecord } from "@/lib/predictions/mitigationROI";
import { ROOT_CAUSE_LABELS } from "@/lib/predictions/rootCauseAnalyzer";
import { cn } from "@/lib/utils";

export function MitigationROIPanel() {
  const { list } = useMitigationActions();

  const report = useMemo(() => {
    const rows = list.data ?? [];
    const records: MitigationRecord[] = rows.map((r) => ({
      category: r.category,
      priority: r.priority,
      status: r.status,
      impact_score: r.impact_score,
      otif_before: r.otif_before,
      otif_after: r.otif_after,
      otif_delta: r.otif_delta,
    }));
    return computeROI(records);
  }, [list.data]);

  return (
    <Card className="card-raised">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>ROI de Mitigações por Categoria</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Medidas: {report.totalMeasured}</Badge>
          <Badge variant={report.overallAvgDelta >= 0 ? "default" : "destructive"}>
            Δ médio geral: {report.overallAvgDelta.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : report.byCategory.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Sem dados de ROI ainda"
            description="Conclua uma mitigação com medição de OTIF para começar a comparar categorias."
          />
        ) : (
          <>
            {report.topCategory && report.worstCategory && report.topCategory !== report.worstCategory ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <HighlightCard
                  icon={Award}
                  tone="success"
                  label="Maior retorno"
                  category={ROOT_CAUSE_LABELS[report.topCategory]}
                />
                <HighlightCard
                  icon={AlertTriangle}
                  tone="destructive"
                  label="Menor retorno"
                  category={ROOT_CAUSE_LABELS[report.worstCategory]}
                />
              </div>
            ) : null}
            <ul className="space-y-2">
              {report.byCategory.map((c) => (
                <ROIRow
                  key={c.category}
                  label={ROOT_CAUSE_LABELS[c.category]}
                  roiScore={c.roiScore}
                  avgDelta={c.avgDelta}
                  successRate={c.successRate}
                  bestDelta={c.bestDelta}
                  worstDelta={c.worstDelta}
                  measured={c.measuredActions}
                  total={c.totalActions}
                />
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface HighlightProps {
  icon: typeof Award;
  tone: "success" | "destructive";
  label: string;
  category: string;
}
function HighlightCard({ icon: Icon, tone, label, category }: HighlightProps) {
  const cls = tone === "success" ? "border-success/40 bg-success/5 text-success" : "border-destructive/40 bg-destructive/5 text-destructive";
  return (
    <div className={cn("rounded-lg border p-3 flex items-center gap-3", cls)}>
      <Icon className="h-5 w-5" />
      <div>
        <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
        <p className="font-semibold text-foreground">{category}</p>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  roiScore: number;
  avgDelta: number;
  successRate: number;
  bestDelta: number;
  worstDelta: number;
  measured: number;
  total: number;
}
function ROIRow({ label, roiScore, avgDelta, successRate, bestDelta, worstDelta, measured, total }: RowProps) {
  const deltaTone = avgDelta > 0 ? "text-success" : avgDelta < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <li className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {measured}/{total} medidas · sucesso {successRate.toFixed(0)}% · melhor {bestDelta.toFixed(1)}% · pior {worstDelta.toFixed(1)}%
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Δ médio</p>
          <p className={cn("text-lg font-bold leading-tight", deltaTone)}>
            {avgDelta > 0 ? "+" : ""}{avgDelta.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", roiScore >= 60 ? "bg-success" : roiScore >= 40 ? "bg-warning" : "bg-destructive")}
          style={{ width: `${roiScore}%` }}
          aria-label={`ROI score ${roiScore}`}
        />
      </div>
      <p className="mt-1 text-right text-xs text-muted-foreground">Score ROI: {roiScore}/100</p>
    </li>
  );
}

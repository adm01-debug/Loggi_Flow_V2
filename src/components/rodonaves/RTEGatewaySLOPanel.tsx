import { useMemo, useState } from "react";
import { Gauge, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  evaluateAllSLO,
  loadSLOTarget,
  saveSLOTarget,
  summarizeSLO,
  type GatewaySLOInput,
  type GatewaySLOResult,
  type SLOStatus,
} from "@/lib/rodonaves/gatewaySLO";

const STATUS_TONE: Record<SLOStatus, { label: string; className: string }> = {
  ok: { label: "Dentro da meta", className: "bg-primary/10 text-primary border-primary/20" },
  atencao: { label: "Atenção", className: "bg-muted text-muted-foreground border-border" },
  violado: { label: "Violado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

function StatusIcon({ status }: { status: SLOStatus }) {
  if (status === "ok") return <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />;
  if (status === "atencao") return <TriangleAlert className="h-4 w-4 text-muted-foreground" aria-hidden />;
  return <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />;
}

interface SLORowProps {
  result: GatewaySLOResult;
  label: string;
}

function SLORow({ result, label }: SLORowProps) {
  const tone = STATUS_TONE[result.status];
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <StatusIcon status={result.status} />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            Uptime {result.uptimePct.toFixed(1)}% · P95 {result.p95LatencyMs}ms
            {result.latencyOverBudgetMs > 0 && ` (+${result.latencyOverBudgetMs}ms acima)`}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-3 md:max-w-xs">
        <Progress value={Math.min(100, result.errorBudgetUsedPct)} className="h-2 flex-1" />
        <span className="w-24 text-right text-xs text-muted-foreground">
          budget {result.errorBudgetUsedPct.toFixed(1)}%
        </span>
      </div>

      <Badge variant="outline" className={cn("w-fit text-xs", tone.className)}>
        {tone.label}
      </Badge>
    </div>
  );
}

export interface RTEGatewaySLOPanelProps {
  /** Métricas agregadas por gateway (uptime e P95 já calculados). */
  metrics: GatewaySLOInput[];
  /** Rótulos amigáveis por chave de gateway. */
  labels?: Record<string, string>;
  className?: string;
}

/**
 * SLO por gateway com metas configuráveis (persistidas localmente)
 * e consumo de error budget por gateway.
 */
export function RTEGatewaySLOPanel({ metrics, labels = {}, className }: RTEGatewaySLOPanelProps) {
  const [target, setTarget] = useState(() => loadSLOTarget());

  const results = useMemo(() => evaluateAllSLO(metrics, target), [metrics, target]);
  const summary = useMemo(() => summarizeSLO(results), [results]);

  const update = (patch: Partial<typeof target>) => {
    setTarget(saveSLOTarget({ ...target, ...patch }));
  };

  return (
    <Card className={cn("card-raised", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="h-5 w-5 text-primary" aria-hidden />
          SLO por gateway
        </CardTitle>
        <CardDescription>
          {summary.total > 0
            ? `${summary.ok} dentro da meta · ${summary.atencao} em atenção · ${summary.violado} violados · budget médio ${summary.avgBudgetUsedPct.toFixed(1)}%`
            : "Sem métricas suficientes para avaliar o SLO."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="slo-uptime" className="text-xs">
              Meta de disponibilidade (%)
            </Label>
            <Input
              id="slo-uptime"
              type="number"
              min={50}
              max={100}
              step={0.1}
              value={target.uptimeTargetPct}
              onChange={(event) => update({ uptimeTargetPct: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slo-latency" className="text-xs">
              Budget de latência P95 (ms)
            </Label>
            <Input
              id="slo-latency"
              type="number"
              min={50}
              max={120000}
              step={50}
              value={target.latencyP95BudgetMs}
              onChange={(event) => update({ latencyP95BudgetMs: Number(event.target.value) })}
            />
          </div>
        </div>

        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum gateway avaliado ainda. Execute uma verificação de saúde para gerar métricas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <SLORow
                key={result.gateway}
                result={result}
                label={labels[result.gateway] ?? result.gateway}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

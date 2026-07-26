import { useMemo, useState } from "react";
import { History, RefreshCw, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSLOSnapshots, type SLOSnapshotRow } from "@/hooks/rodonaves/useSLOSnapshots";

const STATUS_TONE: Record<SLOSnapshotRow["status"], { label: string; className: string }> = {
  ok: { label: "Dentro da meta", className: "bg-primary/10 text-primary border-primary/20" },
  atencao: { label: "Atenção", className: "bg-muted text-muted-foreground border-border" },
  violado: { label: "Violado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

function StatusIcon({ status }: { status: SLOSnapshotRow["status"] }) {
  if (status === "ok") return <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />;
  if (status === "atencao") return <TriangleAlert className="h-4 w-4 text-muted-foreground" aria-hidden />;
  return <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />;
}

function formatDay(day: string): string {
  const [year, month, date] = day.split("-");
  return year && month && date ? `${date}/${month}/${year}` : day;
}

export interface RTESLOHistoryPanelProps {
  /** Janela do histórico persistido em dias. Padrão: 90. */
  days?: number;
  /** Rótulos amigáveis por chave de gateway. */
  labels?: Record<string, string>;
  className?: string;
}

/**
 * Histórico persistido de conformidade de SLO por gateway. Sobrevive à purga
 * de 30 dias do histórico bruto, pois consome os snapshots diários gravados
 * pela rotina automática no banco.
 */
export function RTESLOHistoryPanel({ days = 90, labels = {}, className }: RTESLOHistoryPanelProps) {
  const { rows, aggregates, isLoading, error, canRollup, rollup } = useSLOSnapshots(days);
  const [showAll, setShowAll] = useState(false);

  const recent = useMemo(() => (showAll ? rows : rows.slice(0, 12)), [rows, showAll]);
  const violatedDays = useMemo(
    () => aggregates.reduce((sum, item) => sum + item.violatedDays, 0),
    [aggregates],
  );

  return (
    <Card className={cn("card-raised", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" aria-hidden />
            Histórico de conformidade (SLO)
          </CardTitle>
          <CardDescription>
            {rows.length > 0
              ? `${rows.length} registros diários nos últimos ${days} dias · ${violatedDays} dia(s) com violação`
              : `Sem snapshots persistidos nos últimos ${days} dias.`}
          </CardDescription>
        </div>
        {canRollup && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => rollup.mutate(undefined)}
            disabled={rollup.isPending}
            aria-label="Consolidar snapshot do dia"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", rollup.isPending && "animate-spin")} aria-hidden />
            Consolidar hoje
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`slo-history-skeleton-${index}`} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            Não foi possível carregar o histórico: {error.message}
          </p>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum snapshot diário registrado ainda.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              A consolidação roda automaticamente todo dia às 00:20 (UTC).
            </p>
          </div>
        )}

        {!isLoading && !error && aggregates.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {aggregates.map((item) => (
              <div key={item.gateway} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">
                  {labels[item.gateway] ?? item.gateway}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.days} dia(s) · uptime médio {item.avgUptimePct.toFixed(1)}% · pior P95{" "}
                  {item.worstP95Ms}ms
                </p>
                <p className="text-xs text-muted-foreground">
                  budget médio {item.avgBudgetUsedPct.toFixed(1)}% · {item.violatedDays} violação(ões)
                </p>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && recent.length > 0 && (
          <div className="space-y-2">
            {recent.map((row) => {
              const tone = STATUS_TONE[row.status];
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={row.status} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatDay(row.day)} · {labels[row.gateway] ?? row.gateway}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.checks} verificações · {row.failures} falha(s) · uptime{" "}
                        {Number(row.uptime_pct).toFixed(1)}% · P95 {row.p95_latency_ms}ms
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("w-fit text-xs", tone.className)}>
                    {tone.label}
                  </Badge>
                </div>
              );
            })}

            {rows.length > 12 && (
              <Button variant="ghost" size="sm" onClick={() => setShowAll((prev) => !prev)}>
                {showAll ? "Mostrar menos" : `Ver todos (${rows.length})`}
              </Button>
            )}
          </div>
        )}

        {rollup.isError && (
          <p role="alert" className="text-sm text-destructive">
            Falha ao consolidar: {(rollup.error as Error).message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

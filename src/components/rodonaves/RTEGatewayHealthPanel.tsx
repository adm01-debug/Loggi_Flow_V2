import { useMemo } from "react";
import { Activity, RefreshCw, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGatewayHealth, type GatewayUptime } from "@/hooks/rodonaves/useGatewayHealth";
import { RTELatencyTrendChart } from "./RTELatencyTrendChart";
import { RTEGatewaySLOPanel } from "./RTEGatewaySLOPanel";


const GATEWAY_LABEL: Record<string, string> = {
  tracking: "Rastreio",
  quotation: "Cotação",
  pickup: "Coleta",
  customer: "Clientes",
  selfattendance: "Autoatendimento",
  unittocity: "Malha de atendimento",
  payments: "Financeiro",
  dne: "Endereçamento (DNE)",
};

function uptimeTone(pct: number): { label: string; className: string } {
  if (pct >= 99) return { label: "Estável", className: "bg-primary/10 text-primary border-primary/20" };
  if (pct >= 90) return { label: "Instável", className: "bg-muted text-muted-foreground border-border" };
  return { label: "Crítico", className: "bg-destructive/10 text-destructive border-destructive/20" };
}

interface GatewayRowProps {
  item: GatewayUptime;
}

function GatewayRow({ item }: GatewayRowProps) {
  const tone = uptimeTone(item.uptimePct);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        {item.lastOnline ? (
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
        ) : (
          <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            {GATEWAY_LABEL[item.gateway] ?? item.gateway}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.checks} verificaç{item.checks === 1 ? "ão" : "ões"} no período
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-4 md:max-w-sm">
        <Progress value={item.uptimePct} className="h-2 flex-1" />
        <span className="w-14 text-right text-sm font-semibold text-foreground">
          {item.uptimePct.toFixed(1)}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("text-xs", tone.className)}>
          {tone.label}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-3 w-3" aria-hidden />
          {item.avgLatencyMs}ms · P95 {item.p95LatencyMs}ms
        </span>
      </div>
    </div>
  );
}

export interface RTEGatewayHealthPanelProps {
  /** Janela de análise em horas. Padrão: 24h. */
  hours?: number;
  className?: string;
}

/**
 * Painel de disponibilidade dos 8 gateways da Rodonaves, com uptime histórico,
 * latência média/P95 e execução manual de verificação.
 */
export function RTEGatewayHealthPanel({ hours = 24, className }: RTEGatewayHealthPanelProps) {
  const { history, uptime, downtime, isLoading, error, runCheck } = useGatewayHealth(hours);

  const summary = useMemo(() => {
    if (uptime.length === 0) return { online: 0, total: 0, avgUptime: 0 };
    const online = uptime.filter((u) => u.lastOnline).length;
    const avgUptime = uptime.reduce((sum, u) => sum + u.uptimePct, 0) / uptime.length;
    return { online, total: uptime.length, avgUptime };
  }, [uptime]);

  const sloMetrics = useMemo(
    () =>
      uptime.map((item) => ({
        gateway: item.gateway,
        checks: item.checks,
        uptimePct: item.uptimePct,
        p95LatencyMs: item.p95LatencyMs,
      })),
    [uptime],
  );



  return (
    <Card className={cn("card-raised", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" aria-hidden />
            Saúde dos gateways Rodonaves
          </CardTitle>
          <CardDescription>
            Disponibilidade das últimas {hours}h — {summary.online}/{summary.total} no ar
            {summary.total > 0 && ` · uptime médio ${summary.avgUptime.toFixed(1)}%`}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runCheck.mutate()}
          disabled={runCheck.isPending}
          aria-label="Verificar gateways agora"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", runCheck.isPending && "animate-spin")} aria-hidden />
          Verificar agora
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {downtime.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <p className="font-medium">
              Queda sustentada detectada em {downtime.length} gateway
              {downtime.length === 1 ? "" : "s"} (últimas 2h)
            </p>
            <ul className="mt-1 list-disc pl-5 text-xs">
              {downtime.map((item) => (
                <li key={item.gateway}>
                  {GATEWAY_LABEL[item.gateway] ?? item.gateway}
                  {item.last_error ? ` — ${item.last_error}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}


        {isLoading && (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`gateway-skeleton-${index}`} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            Não foi possível carregar o histórico: {error.message}
          </p>
        )}

        {!isLoading && !error && uptime.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma verificação registrada nas últimas {hours}h.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use “Verificar agora” para gerar o primeiro registro.
            </p>
          </div>
        )}

        {!isLoading && !error && history.length > 0 && (
          <RTELatencyTrendChart samples={history} labels={GATEWAY_LABEL} />
        )}

        {!isLoading &&
          !error &&
          uptime.map((item) => <GatewayRow key={item.gateway} item={item} />)}

        {!isLoading && !error && uptime.length > 0 && (
          <RTEGatewaySLOPanel
            metrics={sloMetrics}
            samples={history}
            labels={GATEWAY_LABEL}
            className="mt-2"
          />
        )}




        {runCheck.isError && (
          <p className="text-sm text-destructive">
            Falha na verificação: {(runCheck.error as Error).message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

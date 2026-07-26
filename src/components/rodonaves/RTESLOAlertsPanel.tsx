import { useEffect, useMemo, useState } from "react";
import { BellRing, ShieldAlert, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { GatewaySLOResult } from "@/lib/rodonaves/gatewaySLO";
import {
  applyAlerts,
  evaluateSLOAlerts,
  loadAlertState,
  saveAlertState,
  summarizeAlerts,
  type AlertSeverity,
  type AlertState,
  type SLOAlert,
} from "@/lib/rodonaves/sloAlerts";

const SEVERITY_TONE: Record<AlertSeverity, { label: string; className: string }> = {
  critical: { label: "Crítico", className: "bg-destructive/10 text-destructive border-destructive/20" },
  warning: { label: "Atenção", className: "bg-muted text-muted-foreground border-border" },
  info: { label: "Informativo", className: "bg-primary/10 text-primary border-primary/20" },
};

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  if (severity === "critical") return <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />;
  if (severity === "warning") return <TriangleAlert className="h-4 w-4 text-muted-foreground" aria-hidden />;
  return <BellRing className="h-4 w-4 text-primary" aria-hidden />;
}

export interface RTESLOAlertsPanelProps {
  /** Resultados de SLO já avaliados por gateway. */
  results: GatewaySLOResult[];
  /** Rótulos amigáveis por chave de gateway. */
  labels?: Record<string, string>;
  className?: string;
}

/**
 * Alertas ativos de violação de SLO por gateway, com deduplicação e
 * cooldown persistidos localmente para evitar ruído operacional.
 */
export function RTESLOAlertsPanel({ results, labels = {}, className }: RTESLOAlertsPanelProps) {
  const [state, setState] = useState<AlertState[]>(() => loadAlertState());
  const [includeHealthy, setIncludeHealthy] = useState(false);
  const [fired, setFired] = useState<SLOAlert[]>([]);

  const pending = useMemo(
    () =>
      evaluateSLOAlerts(
        results,
        state,
        { minSeverity: includeHealthy ? "info" : "warning" },
        labels,
      ),
    [results, state, includeHealthy, labels],
  );

  useEffect(() => {
    setFired((current) => (current.length > 0 && pending.length === 0 ? current : pending));
  }, [pending]);

  const visible = pending.length > 0 ? pending : fired;
  const summary = useMemo(() => summarizeAlerts(visible), [visible]);

  const acknowledge = () => {
    const next = applyAlerts(state, pending);
    setState(saveAlertState(next));
    setFired([]);
  };

  return (
    <Card className={cn("card-raised", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="h-5 w-5 text-primary" aria-hidden />
            Alertas de SLO
          </CardTitle>
          <CardDescription>
            {summary.total > 0
              ? `${summary.critical} crítico(s) · ${summary.warning} em atenção`
              : "Nenhum alerta pendente no momento."}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={acknowledge}
          disabled={pending.length === 0}
          aria-label="Reconhecer alertas de SLO"
        >
          Reconhecer
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="slo-alerts-healthy"
            checked={includeHealthy}
            onCheckedChange={setIncludeHealthy}
            aria-label="Incluir gateways saudáveis nos alertas"
          />
          <Label htmlFor="slo-alerts-healthy" className="text-xs text-muted-foreground">
            Incluir gateways dentro da meta (informativo)
          </Label>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Todos os gateways estão dentro das metas ou os alertas já foram reconhecidos.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((alert) => {
              const tone = SEVERITY_TONE[alert.severity];
              return (
                <li
                  key={`${alert.gateway}-${alert.severity}`}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <SeverityIcon severity={alert.severity} />
                    <p className="text-sm text-foreground">{alert.message}</p>
                  </div>
                  <Badge variant="outline" className={cn("w-fit text-xs", tone.className)}>
                    {tone.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

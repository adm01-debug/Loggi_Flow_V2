import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Zap,
  Activity,
  AlertTriangle,
  History,
  TrendingUp,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useGlobalHealthScore } from "@/features/db-observability/hooks/useGlobalHealthScore";
import { useRemediationMttr } from "@/features/db-observability/hooks/useRemediationMttr";
import { useRemediationSuggestions } from "@/features/db-observability/hooks/useRemediationSuggestions";

interface DORAIndicatorProps {
  label: string;
  value: string;
  trend?: string | null;
  status: "elite" | "high" | "medium" | "low";
  icon: React.ComponentType<{ className?: string }>;
}

const DORAIndicator = ({
  label,
  value,
  trend,
  status,
  icon: Icon,
}: DORAIndicatorProps) => {
  const statusColors = {
    elite: "text-success border-success/30 bg-success/5",
    high: "text-primary border-primary/30 bg-primary/5",
    medium: "text-warning border-warning/30 bg-warning/5",
    low: "text-destructive border-destructive/30 bg-destructive/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <Badge variant="outline" className={statusColors[status]}>
          {status.toUpperCase()}
        </Badge>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
          {label}
        </p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-2xl font-black text-foreground">{value}</span>
          {trend && (
            <span className="text-[10px] text-success font-bold mb-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/** Nível DORA derivado de um score 0–100 real (grade A+..F). */
function levelForScore(
  score: number | null | undefined,
): "elite" | "high" | "medium" | "low" {
  if (score == null) return "low";
  if (score >= 90) return "elite";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const fmtHours = (h: number | null | undefined): string => {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
};

interface HealthDetails {
  critical_anomalies?: number;
  warning_anomalies?: number;
  resolution_rate_pct?: number;
  avg_mttr_hours?: number;
  [key: string]: unknown;
}

interface DerivedLabels {
  deployLabel: string;
  sloLabel: string;
  anomaliesLabel: string;
  capacityLabel: string;
}

/** Deriva os rótulos exibidos dos valores reais (0-100) retornados pelas RPCs. */
function deriveLabels(args: {
  slo: number | null;
  anomaly: number | null;
  capacity: number | null;
  details: HealthDetails | null | undefined;
  anomalies: number;
}): DerivedLabels {
  let anomaliesLabel: string;
  if (args.anomalies > 0) {
    anomaliesLabel = `${args.anomalies} ativas`;
  } else if (args.anomaly != null) {
    anomaliesLabel = `${args.anomaly.toFixed(1)}/100 sem ativos`;
  } else {
    anomaliesLabel = "—";
  }

  let deployLabel: string;
  if (args.details && args.details.resolution_rate_pct != null) {
    deployLabel = `${args.details.resolution_rate_pct.toFixed(1)}% de entregas concluídas`;
  } else {
    deployLabel = "— sem fonte de deploys";
  }

  let sloLabel: string;
  if (args.slo != null) {
    sloLabel = `${args.slo.toFixed(1)}/100`;
  } else {
    sloLabel = "—";
  }

  let capacityLabel: string;
  if (args.capacity != null) {
    capacityLabel = `${args.capacity.toFixed(1)}/100`;
  } else {
    capacityLabel = "—";
  }

  return { deployLabel, sloLabel, anomaliesLabel, capacityLabel };
}

export function DORAMetrics() {
  const health = useGlobalHealthScore();
  const mttr = useRemediationMttr();
  const suggestions = useRemediationSuggestions();

  const loading = health.isLoading || mttr.isLoading;
  const error =
    health.error || mttr.error ? "Falha ao consultar métricas de saúde." : null;

  const grade = health.data?.grade ?? null;
  const slo = health.data?.slo_score ?? null;
  const anomaly = health.data?.anomaly_score ?? null;
  const capacity = health.data?.capacity_score ?? null;
  const mttrScore = health.data?.mttr_score ?? null;
  const details = health.data?.details;

  const mttrHours =
    mttr.data?.find((r) => r.mttr_hours != null)?.mttr_hours ??
    details?.avg_mttr_hours ??
    null;
  const resolutionRate =
    mttr.data?.find((r) => r.resolution_rate_pct != null)
      ?.resolution_rate_pct ??
    details?.resolution_rate_pct ??
    null;

  const pending =
    suggestions.data?.filter((s) => s.severity !== "ok").length ?? null;

  // --- valores derivados das fontes reais (RPCs) ---
  const critical = details?.critical_anomalies ?? 0;
  const warning = details?.warning_anomalies ?? 0;
  const anomalies = critical + warning;

  const { deployLabel, sloLabel, anomaliesLabel, capacityLabel } = deriveLabels(
    {
      slo,
      anomaly,
      capacity,
      details,
      anomalies,
    },
  );

  const indicators = [
    {
      label: "Frequência de Deploy",
      value: deployLabel,
      trend: null,
      status: levelForScore(details?.resolution_rate_pct ?? null),
      icon: Rocket,
    },
    {
      label: "Disponibilidade (SLO)",
      value: sloLabel,
      trend: null,
      status: levelForScore(slo),
      icon: Zap,
    },
    {
      label: "Anomalias Ativas",
      value: anomaliesLabel,
      trend: null,
      status: levelForScore(anomaly),
      icon: AlertTriangle,
    },
    {
      label: "MTTR (Restauração)",
      value: fmtHours(mttrHours),
      trend:
        resolutionRate != null
          ? `resolução ${resolutionRate.toFixed(0)}%`
          : null,
      status: levelForScore(mttrScore),
      icon: History,
    },
  ];

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando métricas reais de operação…
      </div>
    );
  } else if (error) {
    body = (
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-sm text-destructive">
        {error}
      </div>
    );
  } else {
    body = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {indicators.map((ind) => (
            <DORAIndicator key={ind.label} {...ind} />
          ))}
        </div>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">
              Sugestões de Remediação Pendentes
            </h4>
          </div>
          {pending != null && pending > 0 ? (
            <ul className="space-y-3">
              {(suggestions.data ?? [])
                .filter((s) => s.severity !== "ok")
                .slice(0, 4)
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <div className={cnBadge(s.severity)} />
                    <span>
                      {s.title}
                      <span className="text-muted-foreground/70">
                        {" — "}
                        {s.severity}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma remediação pendente detectada no momento.
            </p>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground/70 uppercase tracking-widest">
            Capacidade de processamento: {capacityLabel}
          </p>
        </div>
      </>
    );
  }

  return (
    <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              DORA Metrics (DevOps Excellence)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-[10px] font-black text-muted-foreground uppercase">
              {grade ? `Saúde do Sistema ${grade}` : "Saúde do Sistema"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">{body}</CardContent>
    </Card>
  );
}

const badgeClass = (severity: string) => {
  switch (severity) {
    case "critical":
      return "w-1.5 h-1.5 rounded-full bg-destructive";
    case "warning":
      return "w-1.5 h-1.5 rounded-full bg-warning";
    default:
      return "w-1.5 h-1.5 rounded-full bg-primary/40";
  }
};

const cnBadge = (severity: string) => badgeClass(severity);

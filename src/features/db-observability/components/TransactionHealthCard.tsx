import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useTransactionHealth } from "../hooks/useTransactionHealth";

const severityConfig = {
  critical: { icon: ShieldAlert, variant: "destructive" as const, label: "Crítico" },
  warning: { icon: AlertTriangle, variant: "default" as const, label: "Alerta" },
  ok: { icon: CheckCircle2, variant: "secondary" as const, label: "OK" },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function TransactionHealthCard() {
  const { data, isLoading, error } = useTransactionHealth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde Transacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde Transacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error ? "Erro ao carregar" : "Sem dados"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const cfg = severityConfig[data.severity];
  const Icon = cfg.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde Transacional
          </CardTitle>
          <Badge variant={cfg.variant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Commits</p>
            <p className="text-lg font-semibold">{data.total_commits.toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rollbacks</p>
            <p className="text-lg font-semibold">{data.total_rollbacks.toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa (%)</p>
            <p className="text-lg font-semibold">{data.rollback_ratio_pct}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rollbacks/hora</p>
            <p className="text-lg font-semibold">{data.rollbacks_per_hour}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deadlocks</p>
            <p className="text-lg font-semibold">{data.deadlocks.toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Temp files</p>
            <p className="text-lg font-semibold">{data.temp_files.toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Temp bytes</p>
            <p className="text-lg font-semibold">{formatBytes(data.temp_bytes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Janela</p>
            <p className="text-lg font-semibold">{data.hours_since_reset}h</p>
          </div>
        </div>
        {data.severity !== "ok" && (
          <Alert variant={data.severity === "critical" ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{data.recommendation}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

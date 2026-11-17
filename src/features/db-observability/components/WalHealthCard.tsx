import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HardDriveDownload, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useWalHealth } from "../hooks/useWalHealth";

const severityConfig = {
  critical: { icon: ShieldAlert, variant: "destructive" as const, label: "Crítico" },
  warning: { icon: AlertTriangle, variant: "default" as const, label: "Alerta" },
  ok: { icon: CheckCircle2, variant: "secondary" as const, label: "OK" },
  unknown: { icon: AlertTriangle, variant: "outline" as const, label: "Indisponível" },
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function WalHealthCard() {
  const { data, isLoading, error } = useWalHealth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDriveDownload className="h-5 w-5" />
            WAL vs Banco
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
            <HardDriveDownload className="h-5 w-5" />
            WAL vs Banco
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
            <HardDriveDownload className="h-5 w-5" />
            WAL vs Banco
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
            <p className="text-xs text-muted-foreground">Banco</p>
            <p className="text-lg font-semibold">{formatBytes(data.db_size_bytes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">WAL</p>
            <p className="text-lg font-semibold">
              {data.wal_size_bytes === null ? "—" : formatBytes(data.wal_size_bytes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Razão WAL/DB</p>
            <p className="text-lg font-semibold">
              {data.wal_to_db_ratio === null ? "—" : `${data.wal_to_db_ratio}x`}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">max_wal_size</p>
            <p className="text-lg font-semibold">
              {data.max_wal_size_mb ? `${data.max_wal_size_mb} MB` : "—"}
            </p>
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

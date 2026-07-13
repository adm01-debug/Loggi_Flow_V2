import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitBranch } from "lucide-react";
import { useReplicationStatus } from "../hooks/useReplicationStatus";
import { severityVariantDefault as sevVariant } from "./_severityHelpers";

const fmtBytes = (b: number) => {
  const abs = Math.abs(b);
  if (abs >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (abs >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(2)} MB`;
  if (abs >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
};

export function ReplicationStatusCard() {
  const { data, isLoading, error } = useReplicationStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Status de replicação
          {data && data.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{data.length} réplica(s)</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(() => {
          if (isLoading) {
            return (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            );
          }
          if (error) {
            return <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>;
          }
          if (!data || data.length === 0) {
            return (
              <p className="text-sm text-muted-foreground">
                Nenhuma réplica conectada (setup single-primary ou monitoramento não disponível).
              </p>
            );
          }
          return (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead>Total lag</TableHead>
                    <TableHead>Replay lag</TableHead>
                    <TableHead>Severidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => (
                    <TableRow key={r.pid}>
                      <TableCell className="font-mono text-xs">
                        {r.application_name || r.usename || "—"}
                        <div className="text-muted-foreground">{r.client_addr}</div>
                      </TableCell>
                      <TableCell className="text-xs">{r.state}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline">{r.sync_state}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{fmtBytes(r.total_lag_bytes)}</TableCell>
                      <TableCell className="text-xs">
                        {r.replay_lag_seconds.toFixed(1)}s · {fmtBytes(r.replay_lag_bytes)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sevVariant(r.severity)}>{r.severity}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

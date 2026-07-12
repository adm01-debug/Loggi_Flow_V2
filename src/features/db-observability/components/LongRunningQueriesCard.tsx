import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Ban, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCancelQuery, useLongRunningQueries } from "../hooks/useLongRunningQueries";

const severityVariant = (s: string): "destructive" | "default" | "secondary" =>
  s === "critical" ? "destructive" : s === "warning" ? "default" : "secondary";

export function LongRunningQueriesCard() {
  const { data, isLoading, error } = useLongRunningQueries(30, 50);
  const cancelMutation = useCancelQuery();

  const handleCancel = async (pid: number, terminate: boolean) => {
    try {
      const ok = await cancelMutation.mutateAsync({ pid, terminate });
      toast[ok ? "success" : "error"](
        ok ? `Query ${terminate ? "terminada" : "cancelada"} (PID ${pid})` : `Falha ao ${terminate ? "terminar" : "cancelar"} PID ${pid}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cancelar query");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Queries longas em execução
          {data && data.length > 0 && (
            <Badge variant="destructive" className="ml-auto">{data.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma query longa em execução (≥ 30s).</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((q) => (
                  <TableRow key={q.pid}>
                    <TableCell className="font-mono">{q.pid}</TableCell>
                    <TableCell className="text-sm">{q.usename ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(q.severity)}>
                        {Math.round(q.duration_seconds)}s
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {q.state}
                      {q.wait_event ? ` · ${q.wait_event}` : ""}
                    </TableCell>
                    <TableCell className="max-w-md truncate font-mono text-xs" title={q.query}>
                      {q.query}
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelMutation.isPending}
                        onClick={() => handleCancel(q.pid, false)}
                      >
                        <Ban className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={cancelMutation.isPending}
                        onClick={() => handleCancel(q.pid, true)}
                      >
                        <Zap className="h-3 w-3 mr-1" /> Kill
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

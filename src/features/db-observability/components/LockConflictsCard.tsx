import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Lock, Zap } from "lucide-react";
import { toast } from "sonner";
import { useLockConflicts } from "../hooks/useLockConflicts";
import { useCancelQuery } from "../hooks/useLongRunningQueries";
import { severityVariantDefault as sevVariant } from "./_severityHelpers";

export function LockConflictsCard() {
  const { data, isLoading, error } = useLockConflicts(50);
  const cancel = useCancelQuery();

  const kill = async (pid: number) => {
    try {
      const ok = await cancel.mutateAsync({ pid, terminate: true });
      toast[ok ? "success" : "error"](ok ? `PID ${pid} terminado` : `Falha ao terminar PID ${pid}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Conflitos de lock em tempo real
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
          <p className="text-sm text-muted-foreground">Nenhum lock em espera detectado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bloqueado</TableHead>
                  <TableHead>Espera</TableHead>
                  <TableHead>Bloqueador</TableHead>
                  <TableHead>Lock</TableHead>
                  <TableHead>Relação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c, idx) => (
                  <TableRow key={`${c.blocked_pid}-${c.blocking_pid}-${idx}`}>
                    <TableCell className="font-mono text-xs">
                      PID {c.blocked_pid}
                      <div className="text-muted-foreground truncate max-w-xs" title={c.blocked_query}>
                        {c.blocked_query}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sevVariant(c.severity)}>
                        {Math.round(c.blocked_duration_seconds)}s
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      PID {c.blocking_pid} · {c.blocking_state}
                      <div className="text-muted-foreground truncate max-w-xs" title={c.blocking_query}>
                        {c.blocking_query}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{c.lock_mode}</Badge>
                      <div className="text-muted-foreground mt-1">{c.lock_type}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.relation || "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={cancel.isPending}
                        onClick={() => kill(c.blocking_pid)}
                      >
                        <Zap className="h-3 w-3 mr-1" /> Kill blocker
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

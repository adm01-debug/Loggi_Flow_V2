import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCronJobs } from "../hooks/useCronJobs";

export function CronJobsCard() {
  const { data, isLoading, error } = useCronJobs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Cron Jobs
        </CardTitle>
        <CardDescription>Jobs pg_cron ativos e última execução.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {error && <p className="text-sm text-destructive">Erro ao carregar jobs.</p>}
        {data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Última execução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((j) => (
                <TableRow key={j.jobid}>
                  <TableCell className="font-mono text-xs">{j.jobname}</TableCell>
                  <TableCell className="font-mono text-xs">{j.schedule}</TableCell>
                  <TableCell>
                    <Badge variant={j.active ? "default" : "outline"}>
                      {j.active ? "sim" : "não"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {j.last_start
                      ? formatDistanceToNow(new Date(j.last_start), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (!j.last_status) return "—";
                      let statusVariant: "default" | "destructive" | "secondary" = "secondary";
                      if (j.last_status === "succeeded") statusVariant = "default";
                      else if (j.last_status === "failed") statusVariant = "destructive";
                      return <Badge variant={statusVariant}>{j.last_status}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs">
                    {j.last_duration_ms != null
                      ? `${Number(j.last_duration_ms).toFixed(0)} ms`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCronJobs } from "../hooks/useCronJobs";
import { avaliarCronJobs, type SituacaoCron } from "../cron-status";

const ROTULO: Record<SituacaoCron, string> = {
  falha: "falha",
  atrasado: "atrasado",
  sem_historico: "sem histórico",
  parado: "parado",
  ok: "ok",
};

const VARIANTE: Record<SituacaoCron, "default" | "destructive" | "secondary" | "outline"> = {
  falha: "destructive",
  atrasado: "default",
  sem_historico: "secondary",
  parado: "outline",
  ok: "outline",
};

export function CronJobsCard() {
  const { data, isLoading, error } = useCronJobs();
  const { itens, resumo } = useMemo(() => avaliarCronJobs(data ?? []), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Cron Jobs
        </CardTitle>
        <CardDescription>
          Jobs pg_cron ativos, última execução e o que precisa de atenção.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {error && <p className="text-sm text-destructive">Erro ao carregar jobs.</p>}
        {data && data.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            {resumo.em_alerta === 0 ? (
              <span className="text-muted-foreground">
                Nenhum job com falha ou atraso na última execução.
              </span>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">
                  {resumo.em_alerta} de {resumo.total} jobs precisam de atenção:
                </span>
                {resumo.falha > 0 && (
                  <Badge variant="destructive">{resumo.falha} com falha</Badge>
                )}
                {resumo.atrasado > 0 && (
                  <Badge variant="default">{resumo.atrasado} atrasado(s)</Badge>
                )}
                {resumo.sem_historico > 0 && (
                  <Badge variant="secondary">{resumo.sem_historico} sem histórico</Badge>
                )}
              </>
            )}
          </div>
        )}
        {data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Última execução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map(({ job: j, situacao }) => (
                <TableRow
                  key={j.jobid}
                  className={situacao === "falha" ? "bg-destructive/5" : undefined}
                >
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
                  <TableCell>
                    <Badge variant={VARIANTE[situacao]}>{ROTULO[situacao]}</Badge>
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

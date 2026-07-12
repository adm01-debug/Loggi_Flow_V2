import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle } from "lucide-react";
import { useActiveSessions } from "../hooks/useActiveSessions";

const stateLabel: Record<string, string> = {
  active: "Ativo",
  idle: "Ocioso",
  "idle in transaction": "Ocioso em transação",
  "idle in transaction (aborted)": "Ocioso (abortado)",
  "fastpath function call": "Fastpath",
  disabled: "Desabilitado",
  unknown: "Desconhecido",
};

const severityVariant = (s: string) =>
  s === "critical" ? "destructive" : s === "warning" ? "default" : "secondary";

const fmtSec = (n: number | null) => {
  if (n == null) return "-";
  if (n < 60) return `${n.toFixed(1)}s`;
  if (n < 3600) return `${(n / 60).toFixed(1)}min`;
  return `${(n / 3600).toFixed(1)}h`;
};

export function ActiveSessionsCard() {
  const { data, isLoading, error } = useActiveSessions();

  const critical = data?.filter((d) => d.severity === "critical").length ?? 0;
  const total =
    data?.reduce((acc, r) => acc + Number(r.session_count), 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Sessões Ativas
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{total} conexão(ões)</Badge>
            {critical > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {critical} crítico(s)
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Distribuição de conexões por estado e evento de espera.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            Erro: {(error as Error).message}
          </p>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">
            Sem sessões ativas no momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Estado</th>
                  <th className="p-2">Evento</th>
                  <th className="p-2">Conexões</th>
                  <th className="p-2">Query mais antiga</th>
                  <th className="p-2">Transação mais antiga</th>
                  <th className="p-2">Severidade</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={`${row.state}-${row.wait_event_type}-${i}`} className="border-b">
                    <td className="p-2">
                      {stateLabel[row.state] ?? row.state}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {row.wait_event_type}
                    </td>
                    <td className="p-2 tabular-nums font-medium">
                      {row.session_count}
                    </td>
                    <td className="p-2 tabular-nums">
                      {fmtSec(row.longest_query_seconds)}
                    </td>
                    <td className="p-2 tabular-nums">
                      {fmtSec(row.longest_xact_seconds)}
                    </td>
                    <td className="p-2">
                      <Badge variant={severityVariant(row.severity)}>
                        {row.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

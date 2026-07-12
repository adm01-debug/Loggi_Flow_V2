import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity } from "lucide-react";
import { useTopQueries } from "../hooks/useTopQueries";

export function TopQueriesCard() {
  const { data, isLoading, error } = useTopQueries(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Top 10 Queries por Tempo Total
        </CardTitle>
        <CardDescription>
          Fonte: <code>pg_stat_statements</code>. Ordenado por tempo total acumulado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {error && <p className="text-sm text-destructive">Erro ao carregar top queries.</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sem dados de <code>pg_stat_statements</code>.
          </p>
        )}
        {data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead className="text-right">Chamadas</TableHead>
                <TableHead className="text-right">Média (ms)</TableHead>
                <TableHead className="text-right">Total (ms)</TableHead>
                <TableHead className="text-right">Máx (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((q) => (
                <TableRow key={q.queryid}>
                  <TableCell className="max-w-md truncate font-mono text-xs">
                    {q.query_text}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{q.calls}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(q.mean_exec_ms).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(q.total_exec_ms).toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(q.max_exec_ms).toFixed(2)}
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

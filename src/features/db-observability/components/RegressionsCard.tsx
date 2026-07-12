import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { useDbRegressions } from "../hooks/useDbRegressions";
import { severityOf } from "../types";

export function RegressionsCard() {
  const { data, isLoading, error } = useDbRegressions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          Regressões de Query
        </CardTitle>
        <CardDescription>
          Queries com tempo médio {'>'} 50% acima do baseline diário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {error && (
          <p className="text-sm text-destructive">Erro ao carregar regressões.</p>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma regressão detectada — banco saudável.
          </p>
        )}
        {data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query ID</TableHead>
                <TableHead>Query</TableHead>
                <TableHead className="text-right">Baseline (ms)</TableHead>
                <TableHead className="text-right">Atual (ms)</TableHead>
                <TableHead className="text-right">Regressão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => {
                const sev = severityOf(Number(r.regression_pct));
                return (
                  <TableRow key={r.queryid}>
                    <TableCell className="font-mono text-xs">{r.queryid}</TableCell>
                    <TableCell className="max-w-md truncate font-mono text-xs">
                      {r.query_text}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.baseline_mean_ms).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.current_mean_ms).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          sev === "critical"
                            ? "destructive"
                            : sev === "warning"
                              ? "secondary"
                              : "outline"
                        }
                        className="gap-1"
                      >
                        {sev === "critical" && <AlertTriangle className="h-3 w-3" />}
                        +{Number(r.regression_pct).toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

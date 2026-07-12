import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTopQueries } from "../hooks/useTopQueries";
import { QueryDetailDialog } from "./QueryDetailDialog";

export function TopQueriesCard() {
  const { data, isLoading, error } = useTopQueries(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Top 10 Queries por Tempo Total
        </CardTitle>
        <CardDescription>
          Fonte: <code>pg_stat_statements</code>. Clique em uma linha para ver detalhes e sugestões.
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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((q) => (
                <TableRow
                  key={q.queryid}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetail(Number(q.queryid))}
                >
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
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(Number(q.queryid)); }}>
                      <Search className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <QueryDetailDialog queryid={selectedId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}

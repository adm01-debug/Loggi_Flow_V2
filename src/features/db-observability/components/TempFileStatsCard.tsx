import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HardDrive } from "lucide-react";
import { useTempFileStats } from "../hooks/useTempFileStats";

const sevVariant = (s: string): "destructive" | "default" | "secondary" | "outline" =>
  s === "critical" ? "destructive" : s === "warning" ? "default" : s === "info" ? "secondary" : "outline";

const fmtBytes = (b: number) => {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(2)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
};

export function TempFileStatsCard() {
  const { data, isLoading, error } = useTempFileStats(20);

  const dbRow = data?.find((r) => r.scope === "database");
  const queries = data?.filter((r) => r.scope === "query") ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Disk spill (temp files)
          {dbRow && (
            <Badge variant={sevVariant(dbRow.severity)} className="ml-auto">
              {fmtBytes(dbRow.temp_bytes)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>
        ) : (
          <>
            {dbRow && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{dbRow.temp_files.toLocaleString()}</span> arquivos temporários acumulados desde o último reset. {dbRow.recommendation}
              </div>
            )}

            {queries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma query com spill significativo detectada.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query ID</TableHead>
                      <TableHead>Spill</TableHead>
                      <TableHead>Chamadas</TableHead>
                      <TableHead>Média</TableHead>
                      <TableHead>Query</TableHead>
                      <TableHead>Severidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queries.map((q) => (
                      <TableRow key={q.identifier}>
                        <TableCell className="font-mono text-xs">{q.identifier}</TableCell>
                        <TableCell className="text-xs font-mono">{fmtBytes(q.temp_bytes)}</TableCell>
                        <TableCell className="text-xs">{q.calls?.toLocaleString() ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {q.mean_exec_ms != null ? `${q.mean_exec_ms.toFixed(1)}ms` : "—"}
                        </TableCell>
                        <TableCell className="max-w-md truncate font-mono text-xs" title={q.query_text ?? ""}>
                          {q.query_text}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sevVariant(q.severity)}>{q.severity}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

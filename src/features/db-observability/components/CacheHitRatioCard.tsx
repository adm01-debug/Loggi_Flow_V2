import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gauge } from "lucide-react";
import { useCacheHitRatios } from "../hooks/useCacheHitRatios";

const sevVariant = (s: string): "destructive" | "default" | "secondary" | "outline" => {
  if (s === "critical") return "destructive";
  if (s === "warning") return "default";
  if (s === "info") return "secondary";
  return "outline";
};


const fmtBytes = (b: number) => {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
};

const pct = (r: number) => `${(r * 100).toFixed(2)}%`;

export function CacheHitRatioCard() {
  const { data, isLoading, error } = useCacheHitRatios();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Cache-hit ratio por tabela
          {data && data.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{data.length}</Badge>
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
                Todas as tabelas monitoradas estão com cache-hit ≥ 99%.
              </p>
            );
          }
          return (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Cache Total</TableHead>
                    <TableHead>Heap</TableHead>
                    <TableHead>Índice</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Recomendação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => (
                    <TableRow key={`${r.schema_name}.${r.table_name}`}>
                      <TableCell className="font-mono text-xs">{r.table_name}</TableCell>
                      <TableCell>
                        <Badge variant={sevVariant(r.severity)}>{pct(r.combined_hit_ratio)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{pct(r.heap_hit_ratio)}</TableCell>
                      <TableCell className="text-xs">{pct(r.idx_hit_ratio)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtBytes(r.table_size_bytes)}
                      </TableCell>
                      <TableCell className="text-xs max-w-sm">{r.recommendation}</TableCell>
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


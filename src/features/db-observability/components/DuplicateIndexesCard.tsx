import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Layers } from "lucide-react";
import { toast } from "sonner";
import { useDuplicateIndexes } from "../hooks/useDuplicateIndexes";
import { severityVariantDefault as sevVariant } from "./_severityHelpers";

const fmtBytes = (b: number) => {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
};

export function DuplicateIndexesCard() {
  const { data, isLoading, error } = useDuplicateIndexes(30);

  const totalReclaim = data?.reduce((acc, r) => acc + r.drop_size_bytes, 0) ?? 0;

  const copy = (ddl: string) => {
    navigator.clipboard.writeText(ddl);
    toast.success("DDL copiado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Índices duplicados / redundantes
          {data && data.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {data.length} · recuperável {fmtBytes(totalReclaim)}
            </Badge>
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
            return <p className="text-sm text-muted-foreground">Nenhum índice duplicado ou redundante detectado.</p>;
          }
          return (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Manter</TableHead>
                    <TableHead>Remover</TableHead>
                    <TableHead>Relação</TableHead>
                    <TableHead>Recuperar</TableHead>
                    <TableHead className="text-right">DDL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r, i) => (
                    <TableRow key={`${r.keep_index}-${r.drop_index}-${i}`}>
                      <TableCell className="font-mono text-xs">{r.table_name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.keep_index}
                        <div className="text-muted-foreground">({r.keep_columns}) · {r.keep_scans} scans</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.drop_index}
                        <div className="text-muted-foreground">({r.drop_columns}) · {r.drop_scans} scans</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {r.relationship === "exact_duplicate" ? "duplicado" : "prefixo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sevVariant(r.severity)}>{fmtBytes(r.drop_size_bytes)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => copy(r.drop_ddl)}>
                          <Copy className="h-3 w-3 mr-1" /> DROP
                        </Button>
                      </TableCell>
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

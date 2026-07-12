import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { useUnindexedForeignKeys } from "../hooks/useUnindexedForeignKeys";

const severityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function UnindexedFksCard() {
  const { data, isLoading, error } = useUnindexedForeignKeys();

  const copyDdl = (ddl: string) => {
    navigator.clipboard.writeText(ddl);
    toast.success("DDL de índice copiado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <div className="flex items-center gap-2">
            <Link2Off className="h-5 w-5 text-primary" />
            Foreign Keys sem Índice
          </div>
          {data && data.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {data.length} FKs sem cobertura
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          FKs sem índice geram lock em cascata e deadlocks em DELETE/UPDATE da tabela pai. Adicionar o índice é geralmente uma vitória silenciosa.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Erro ao carregar FKs: {(error as Error).message}
          </p>
        )}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todas as foreign keys têm índice de suporte. 🎉
          </p>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((row) => (
              <div
                key={`${row.table_name}.${row.constraint_name}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant[row.severity]} className="uppercase text-[10px]">
                      {row.severity}
                    </Badge>
                    <span className="font-mono text-sm">{row.table_name}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {row.referenced_table}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    colunas{" "}
                    <strong className="text-foreground font-mono">
                      ({row.fk_columns.join(", ")})
                    </strong>{" "}
                    · tabela{" "}
                    <strong className="text-foreground">
                      {formatBytes(row.table_size_bytes)}
                    </strong>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyDdl(row.suggested_ddl)}
                  className="gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  CREATE INDEX
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

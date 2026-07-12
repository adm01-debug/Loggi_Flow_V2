import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUnusedIndexes } from "../hooks/useUnusedIndexes";

const severityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
  ok: "outline",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function UnusedIndexesCard() {
  const { data, isLoading, error } = useUnusedIndexes();

  const totalWaste = data?.reduce((sum, r) => sum + Number(r.index_size_bytes), 0) ?? 0;

  const copyDdl = (ddl: string) => {
    navigator.clipboard.writeText(ddl);
    toast.success("DDL copiado para a área de transferência");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-primary" />
            Índices Não Utilizados
          </div>
          {totalWaste > 0 && (
            <Badge variant="secondary" className="text-xs">
              {formatBytes(totalWaste)} recuperáveis
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Índices sem uso (ou uso residual) que consomem disco e encarecem escritas. Avalie antes de descartar — índices únicos e PKs são ignorados.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Erro ao carregar índices: {(error as Error).message}
          </p>
        )}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum índice desperdiçando espaço no momento. 🎉
          </p>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((row) => (
              <div
                key={`${row.schema_name}.${row.index_name}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant[row.severity]} className="uppercase text-[10px]">
                      {row.severity}
                    </Badge>
                    <span className="truncate font-mono text-sm">{row.index_name}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    tabela <strong className="text-foreground">{row.table_name}</strong> ·{" "}
                    tamanho{" "}
                    <strong className="text-foreground">{formatBytes(row.index_size_bytes)}</strong>{" "}
                    · scans{" "}
                    <strong className="text-foreground">
                      {row.index_scans.toLocaleString("pt-BR")}
                    </strong>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyDdl(row.drop_ddl)}
                  className="gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  DROP DDL
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBloatHotspots } from "../hooks/useBloatHotspots";

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

function formatWhen(ts: string | null): string {
  if (!ts) return "nunca";
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: ptBR });
  } catch {
    return "—";
  }
}

export function BloatHotspotsCard() {
  const { data, isLoading, error } = useBloatHotspots();

  const totalBloat = data?.reduce((sum, r) => sum + Number(r.estimated_bloat_bytes), 0) ?? 0;

  const copyDdl = (ddl: string) => {
    navigator.clipboard.writeText(ddl);
    toast.success("Comando VACUUM copiado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <div className="flex items-center gap-2">
            <Broom className="h-5 w-5 text-primary" />
            Bloat & Necessidade de VACUUM
          </div>
          {totalBloat > 0 && (
            <Badge variant="secondary" className="text-xs">
              ~{formatBytes(totalBloat)} de bloat estimado
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tabelas com muitas tuplas mortas — VACUUM recupera espaço e mantém o planner preciso.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Erro ao carregar bloat: {(error as Error).message}
          </p>
        )}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sem bloat significativo — autovacuum saudável. 🎉
          </p>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((row) => (
              <div
                key={`${row.schema_name}.${row.table_name}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant[row.severity]} className="uppercase text-[10px]">
                      {row.severity}
                    </Badge>
                    <span className="truncate font-mono text-sm">{row.table_name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {row.dead_pct}% dead
                    </Badge>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
                    <span>
                      dead{" "}
                      <strong className="text-foreground">
                        {row.dead_tuples.toLocaleString("pt-BR")}
                      </strong>
                    </span>
                    <span>
                      bloat ≈{" "}
                      <strong className="text-foreground">
                        {formatBytes(row.estimated_bloat_bytes)}
                      </strong>
                    </span>
                    <span>autovacuum {formatWhen(row.last_autovacuum)}</span>
                    <span>analyze {formatWhen(row.last_analyze)}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyDdl(row.vacuum_ddl)}
                  className="gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  VACUUM
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

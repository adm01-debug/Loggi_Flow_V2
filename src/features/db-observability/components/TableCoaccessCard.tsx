import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network } from "lucide-react";
import { useTableCoaccess } from "../hooks/useTableCoaccess";

export function TableCoaccessCard() {
  const { data, isLoading, error } = useTableCoaccess(20);

  const maxTime = data && data.length > 0 ? Number(data[0].total_time_ms) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Network className="h-5 w-5 text-primary" />
          Grafo de Co-acesso de Tabelas
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pares de tabelas mais acessadas juntas nas queries mais custosas — candidatos a índices compostos ou views materializadas.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Erro ao carregar grafo: {(error as Error).message}
          </p>
        )}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sem pares de tabelas co-acessados detectados no momento.
          </p>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((edge) => {
              const pct = maxTime > 0 ? (Number(edge.total_time_ms) / maxTime) * 100 : 0;
              return (
                <div
                  key={`${edge.table_a}-${edge.table_b}`}
                  className="relative overflow-hidden rounded-md border border-border bg-card p-3"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/10"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                  <div className="relative flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <Badge variant="outline">{edge.table_a}</Badge>
                      <span className="text-muted-foreground">↔</span>
                      <Badge variant="outline">{edge.table_b}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        <strong className="text-foreground">{edge.co_occurrences}</strong> queries
                      </span>
                      <span>
                        <strong className="text-foreground">
                          {Number(edge.total_calls).toLocaleString("pt-BR")}
                        </strong>{" "}
                        chamadas
                      </span>
                      <span>
                        média{" "}
                        <strong className="text-foreground">
                          {Number(edge.avg_mean_ms).toFixed(1)}ms
                        </strong>
                      </span>
                      <span>
                        total{" "}
                        <strong className="text-foreground">
                          {(Number(edge.total_time_ms) / 1000).toFixed(1)}s
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

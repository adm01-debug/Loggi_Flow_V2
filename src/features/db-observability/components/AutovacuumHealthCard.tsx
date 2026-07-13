import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAutovacuumHealth } from "../hooks/useAutovacuumHealth";
import { severityVariantMuted as severityVariant } from "./_severityHelpers";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export function AutovacuumHealthCard() {
  const { data, isLoading, error } = useAutovacuumHealth(50);

  const criticalCount = (data ?? []).filter((r) => r.severity === "critical").length;

  const copyDdl = (ddl: string) => {
    navigator.clipboard.writeText(ddl);
    toast.success("Comando copiado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Saúde do Autovacuum
          </div>
          {criticalCount > 0 && (
            <Badge variant="destructive">{criticalCount} crítico(s)</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(() => {
          if (isLoading) {
            return (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            );
          }
          if (error) {
            return <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>;
          }
          const rows = data ?? [];
          if (rows.length === 0) {
            return <p className="text-sm text-muted-foreground">Todas as tabelas estão saudáveis.</p>;
          }
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Tabela</th>
                    <th className="py-2 pr-3">Vivas</th>
                    <th className="py-2 pr-3">Mortas</th>
                    <th className="py-2 pr-3">% Morta</th>
                    <th className="py-2 pr-3">Último vacuum</th>
                    <th className="py-2 pr-3">Dias</th>
                    <th className="py-2 pr-3">Severidade</th>
                    <th className="py-2 pr-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.schema_name}.${r.table_name}`} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{r.table_name}</td>
                      <td className="py-2 pr-3">{r.live_tuples.toLocaleString("pt-BR")}</td>
                      <td className="py-2 pr-3">{r.dead_tuples.toLocaleString("pt-BR")}</td>
                      <td className="py-2 pr-3">{r.dead_pct}%</td>
                      <td className="py-2 pr-3 text-xs">
                        {fmtDate(r.last_autovacuum ?? r.last_vacuum)}
                      </td>
                      <td className="py-2 pr-3">{r.days_since_vacuum ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={severityVariant(r.severity)}>{r.severity}</Badge>
                      </td>
                      <td className="py-2 pr-3">
                        {r.recommended_action !== "sem ação" ? (
                          <button
                            onClick={() => copyDdl(r.recommended_action)}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Copy className="h-3 w-3" /> copiar
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

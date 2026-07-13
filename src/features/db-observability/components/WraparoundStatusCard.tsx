import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Copy, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { useWraparoundStatus } from "../hooks/useWraparoundStatus";
import { severityVariantDefault as severityVariant } from "./_severityHelpers";

function formatBytes(n: number) {
  if (!n) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

export function WraparoundStatusCard() {
  const { data, isLoading, error } = useWraparoundStatus(30);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Comando copiado");
  };

  const critical = data?.filter((d) => d.severity === "critical").length ?? 0;
  const warning = data?.filter((d) => d.severity === "warning").length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-primary" />
            Wraparound / XID Age
          </CardTitle>
          <div className="flex gap-2">
            {critical > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {critical} crítico(s)
              </Badge>
            )}
            {warning > 0 && <Badge>{warning} alerta(s)</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Idade das transações por tabela vs. limite de autovacuum freeze.
        </p>
      </CardHeader>
      <CardContent>
        {(() => {
          if (isLoading) {
            return (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            );
          }
          if (error) {
            return (
              <p className="text-sm text-destructive">
                Erro ao carregar wraparound: {(error as Error).message}
              </p>
            );
          }
          if (!data?.length) {
            return <p className="text-sm text-muted-foreground">Sem dados.</p>;
          }
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Tabela</th>
                    <th className="p-2">Idade XID</th>
                    <th className="p-2">% do limite</th>
                    <th className="p-2">Tamanho</th>
                    <th className="p-2">Último autovacuum</th>
                    <th className="p-2">Severidade</th>
                    <th className="p-2">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr
                      key={`${row.schema_name}.${row.table_name}`}
                      className="border-b"
                    >
                      <td className="p-2 font-mono text-xs">
                        {row.schema_name}.{row.table_name}
                      </td>
                      <td className="p-2 tabular-nums">
                        {row.xid_age.toLocaleString("pt-BR")}
                      </td>
                      <td className="p-2 tabular-nums">
                        {row.pct_towards_wraparound}%
                      </td>
                      <td className="p-2 tabular-nums">
                        {formatBytes(row.table_size_bytes)}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {row.last_autovacuum
                          ? new Date(row.last_autovacuum).toLocaleString("pt-BR")
                          : "nunca"}
                      </td>
                      <td className="p-2">
                        <Badge variant={severityVariant(row.severity)}>
                          {row.severity}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {row.severity !== "ok" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 h-7"
                            onClick={() => copy(row.recommendation)}
                          >
                            <Copy className="h-3 w-3" />
                            Copiar
                          </Button>
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

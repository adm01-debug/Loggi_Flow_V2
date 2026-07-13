import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Puzzle, Copy } from "lucide-react";
import { toast } from "sonner";
import { useExtensionsAudit } from "../hooks/useExtensionsAudit";

export function ExtensionsAuditCard() {
  const { data, isLoading, error } = useExtensionsAudit();
  const outdated = data?.filter((e) => e.update_available).length ?? 0;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Comando copiado");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            Extensões PostgreSQL
          </CardTitle>
          <div className="flex gap-2">
            {outdated > 0 ? (
              <Badge>{outdated} atualização(ões)</Badge>
            ) : (
              <Badge variant="secondary">Tudo atualizado</Badge>
            )}
            <Badge variant="outline">{data?.length ?? 0} instaladas</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Extensões instaladas, versão atual vs. disponível.
        </p>
      </CardHeader>
      <CardContent>
        {(() => {
          if (isLoading) {
            return (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            );
          }
          if (error) {
            return (
              <p className="text-sm text-destructive">
                Erro: {(error as Error).message}
              </p>
            );
          }
          if (!data?.length) {
            return <p className="text-sm text-muted-foreground">Sem extensões.</p>;
          }
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Extensão</th>
                    <th className="p-2">Schema</th>
                    <th className="p-2">Instalada</th>
                    <th className="p-2">Disponível</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.extension_name} className="border-b">
                      <td className="p-2 font-mono text-xs font-medium">
                        {row.extension_name}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {row.schema_name}
                      </td>
                      <td className="p-2 tabular-nums">{row.installed_version}</td>
                      <td className="p-2 tabular-nums">
                        {row.default_version ?? "-"}
                      </td>
                      <td className="p-2">
                        {row.update_available ? (
                          <Badge>update</Badge>
                        ) : (
                          <Badge variant="secondary">ok</Badge>
                        )}
                      </td>
                      <td className="p-2">
                        {row.update_available ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1"
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

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldAlert, Copy } from "lucide-react";
import { toast } from "sonner";
import { useRlsAudit } from "../hooks/useRlsAudit";
import { severityVariantDefault as severityVariant } from "./_severityHelpers";

export function RlsAuditCard() {
  const { data, isLoading, error } = useRlsAudit();
  const [showOnlyIssues, setShowOnlyIssues] = useState(true);

  const filtered = useMemo(() => {
    if (!data) return [];
    return showOnlyIssues ? data.filter((r) => r.severity !== "ok") : data;
  }, [data, showOnlyIssues]);

  const critical = data?.filter((r) => r.severity === "critical").length ?? 0;
  const warning = data?.filter((r) => r.severity === "warning").length ?? 0;
  const ok = data?.filter((r) => r.severity === "ok").length ?? 0;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Comando copiado");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {critical > 0 ? (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
            Auditoria RLS
          </CardTitle>
          <div className="flex gap-2">
            {critical > 0 && (
              <Badge variant="destructive">{critical} sem RLS</Badge>
            )}
            {warning > 0 && (
              <Badge>{warning} sem política</Badge>
            )}
            <Badge variant="secondary">{ok} ok</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowOnlyIssues((v) => !v)}
            >
              {showOnlyIssues ? "Mostrar todas" : "Só problemas"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Row Level Security por tabela pública.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            Erro: {(error as Error).message}
          </p>
        ) : !filtered.length ? (
          <p className="text-sm text-muted-foreground">
            {showOnlyIssues
              ? "🎉 Nenhum problema de RLS detectado."
              : "Sem tabelas."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Tabela</th>
                  <th className="p-2">RLS</th>
                  <th className="p-2">Políticas</th>
                  <th className="p-2">S/I/U/D</th>
                  <th className="p-2">Severidade</th>
                  <th className="p-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={`${row.schema_name}.${row.table_name}`}
                    className="border-b"
                  >
                    <td className="p-2 font-mono text-xs">{row.table_name}</td>
                    <td className="p-2">
                      {row.rls_enabled ? (
                        <Badge variant="secondary">on</Badge>
                      ) : (
                        <Badge variant="destructive">off</Badge>
                      )}
                    </td>
                    <td className="p-2 tabular-nums">{row.policy_count}</td>
                    <td className="p-2 font-mono text-xs">
                      {row.has_select_policy ? "S" : "-"}
                      {row.has_insert_policy ? "I" : "-"}
                      {row.has_update_policy ? "U" : "-"}
                      {row.has_delete_policy ? "D" : "-"}
                    </td>
                    <td className="p-2">
                      <Badge variant={severityVariant(row.severity)}>
                        {row.severity}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground max-w-md">
                      <div className="flex items-start gap-2">
                        <span className="flex-1">{row.recommendation}</span>
                        {row.severity === "critical" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1"
                            onClick={() => copy(row.recommendation)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

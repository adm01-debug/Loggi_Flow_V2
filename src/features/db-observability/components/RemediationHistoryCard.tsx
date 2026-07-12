import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, CheckCircle2, XCircle } from "lucide-react";
import {
  useRemediationActions,
  useUpdateRemediationStatus,
  type RemediationAction,
} from "../hooks/useRemediationActions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const variant = (s: string): "destructive" | "secondary" | "default" =>
  s === "critical" ? "destructive" : s === "warning" ? "secondary" : "default";

const statusLabel: Record<RemediationAction["status"], string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  resolved: "Resolvida",
  ignored: "Ignorada",
};

const statusVariant = (s: RemediationAction["status"]): "default" | "secondary" | "outline" =>
  s === "resolved" ? "default" : s === "ignored" ? "outline" : "secondary";

export function RemediationHistoryCard() {
  const { data, isLoading, error } = useRemediationActions();
  const update = useUpdateRemediationStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Remediações
        </CardTitle>
        <CardDescription>
          Ações aplicadas por admins — marque como resolvida ou ignorada quando concluir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando histórico…</p>}
        {error && <p className="text-sm text-destructive">Erro ao carregar histórico.</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma remediação registrada ainda.
          </p>
        )}
        {data?.map((a) => (
          <div key={a.id} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  Aplicada{" "}
                  {a.applied_at
                    ? formatDistanceToNow(new Date(a.applied_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={variant(a.severity)}>{a.severity}</Badge>
                <Badge variant={statusVariant(a.status)}>{statusLabel[a.status]}</Badge>
              </div>
            </div>
            {a.detail && (
              <p className="text-xs text-muted-foreground">{a.detail}</p>
            )}
            {(a.status === "pending" || a.status === "in_progress") && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => update.mutate({ id: a.id, status: "resolved" })}
                  disabled={update.isPending}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolver
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => update.mutate({ id: a.id, status: "ignored" })}
                  disabled={update.isPending}
                  className="gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Ignorar
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

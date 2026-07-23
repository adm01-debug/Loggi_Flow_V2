import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccuracyMetaAudit } from "@/hooks/logistics/useAccuracyMetaAudit";

type StatusFilter = "all" | "read" | "unread";

export function AccuracyMetaAuditPanel() {
  const { data, isLoading, refetch, isFetching } = useAccuracyMetaAudit(200);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (status === "read" && !r.read) return false;
      if (status === "unread" && r.read) return false;
      if (!term) return true;
      return (
        r.title.toLowerCase().includes(term) ||
        r.message.toLowerCase().includes(term) ||
        (r.carrier ?? "").toLowerCase().includes(term)
      );
    });
  }, [data, search, status]);

  const total = data?.length ?? 0;
  const unread = (data ?? []).filter((r) => !r.read).length;

  return (
    <div className="card-base p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">
              Auditoria de Alertas de Meta
            </h3>
            <p className="text-xs text-muted-foreground">
              Histórico de notificações geradas pelo monitor diário de acurácia
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" /> {total} eventos
          </Badge>
          <Badge variant={unread > 0 ? "destructive" : "default"} className="gap-1">
            <AlertTriangle className="w-3 h-3" /> {unread} pendentes
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          placeholder="Buscar por transportadora, título ou mensagem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="unread">Não lidos</SelectItem>
            <SelectItem value="read">Lidos</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="md:ml-auto"
        >
          Atualizar
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Transportadora</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Acurácia</TableHead>
              <TableHead className="text-right">Dias</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Carregando histórico...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum alerta registrado no período.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="tabular-nums text-xs">
                  {format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-semibold uppercase text-xs">
                  {r.carrier ?? "Todas"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                  {r.message}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.target_pct != null ? `${r.target_pct}%` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.actual_pct != null ? `${r.actual_pct.toFixed(1)}%` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.breach_days ?? "—"}
                </TableCell>
                <TableCell>
                  {r.read ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Lido
                      {r.read_at && (
                        <span className="ml-1 opacity-70">
                          {format(new Date(r.read_at), "dd/MM HH:mm")}
                        </span>
                      )}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" /> Pendente
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

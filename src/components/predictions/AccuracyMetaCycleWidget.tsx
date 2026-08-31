import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNowStrict, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAccuracyMetaCycle, type CycleItem } from "@/hooks/logistics/useAccuracyMetaCycle";

const STATUS_META: Record<
  CycleItem["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendente no ciclo", variant: "destructive" },
  notified: { label: "Notificado", variant: "secondary" },
  warming: { label: "Aproximando meta", variant: "outline" },
  ok: { label: "Dentro da meta", variant: "default" },
};

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function AccuracyMetaCycleWidget() {
  const { data, isLoading } = useAccuracyMetaCycle();
  const now = useNow();

  return (
    <Card className="card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="w-5 h-5 text-primary" />
          Ciclo de Avaliação Automática
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !data ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> Próxima avaliação
                </div>
                <p className="mt-1 text-lg font-bold">
                  em {formatDistanceToNowStrict(data.nextRunAt, { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(data.nextRunAt, "dd/MM/yyyy HH:mm", { locale: ptBR })} (local)
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Última notificação
                </div>
                <p className="mt-1 text-lg font-bold">
                  {data.lastNotifiedAt
                    ? `há ${formatDistanceToNowStrict(data.lastNotifiedAt, { locale: ptBR })}`
                    : "nenhuma"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.lastNotifiedAt
                    ? format(data.lastNotifiedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "aguardando primeiro ciclo"}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Metas monitoradas ({data.items.length})
                </p>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  agora: {format(now, "HH:mm:ss")}
                </span>
              </div>
              {data.items.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  Nenhuma meta configurada. Defina metas no gráfico de acurácia acima.
                </div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                  {data.items.map((item) => {
                    const meta = STATUS_META[item.status];
                    return (
                      <li
                        key={`${item.transportadora ?? "__all__"}-${item.target_pct}`}
                        className="flex items-center justify-between rounded-lg border bg-card/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {item.transportadora ?? "Todas as transportadoras"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Meta {item.target_pct}% · alerta em {item.consecutive_days_alert}d ·
                            streak atual {item.breach_days}d
                          </p>
                        </div>
                        <Badge variant={meta.variant} className="shrink-0">
                          {meta.label}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

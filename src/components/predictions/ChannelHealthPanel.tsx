import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useChannelHealth } from "@/hooks/logistics/useChannelHealth";
import type { ChannelStats } from "../../../supabase/functions/accuracy-meta-monitor/channelHealth";
import { cn } from "@/lib/utils";

const CHANNEL_META = {
  email: { label: "E-mail (Resend)", Icon: Mail },
  whatsapp: { label: "WhatsApp (A-Ticket)", Icon: MessageCircle },
} as const;

function healthTone(rate: number, total: number): { label: string; className: string } {
  if (total === 0) return { label: "Sem disparos", className: "bg-muted text-muted-foreground" };
  if (rate >= 0.95) return { label: "Saudável", className: "bg-emerald-500/15 text-emerald-600" };
  if (rate >= 0.8) return { label: "Atenção", className: "bg-amber-500/15 text-amber-600" };
  return { label: "Degradado", className: "bg-destructive/15 text-destructive" };
}

function ChannelRow({ stats }: { stats: ChannelStats }) {
  const meta = CHANNEL_META[stats.channel];
  const tone = healthTone(stats.successRate, stats.total);
  const ratePct = (stats.successRate * 100).toFixed(1);

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <meta.Icon className="h-4 w-4 text-primary" aria-hidden />
          <div>
            <p className="font-medium text-sm">{meta.label}</p>
            <p className="text-xs text-muted-foreground">
              {stats.total} disparo(s) · Taxa {ratePct}%
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs", tone.className)}>
          {tone.label}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-400">
          <p className="font-semibold">{stats.ok}</p>
          <p>Sucessos</p>
        </div>
        <div className="rounded-md bg-destructive/10 p-2 text-destructive">
          <p className="font-semibold">{stats.error}</p>
          <p>Erros</p>
        </div>
        <div className="rounded-md bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400">
          <p className="font-semibold">{stats.thrown}</p>
          <p>Exceções</p>
        </div>
      </div>

      <div className="text-xs space-y-1 text-muted-foreground">
        <p className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Último envio:{" "}
          {stats.lastDispatchAt
            ? formatDistanceToNow(new Date(stats.lastDispatchAt), { addSuffix: true, locale: ptBR })
            : "—"}
        </p>
        {stats.lastFailureAt && (
          <p className="flex items-start gap-1 text-destructive">
            <AlertCircle className="h-3 w-3 mt-0.5" aria-hidden />
            <span>
              Última falha{" "}
              {formatDistanceToNow(new Date(stats.lastFailureAt), { addSuffix: true, locale: ptBR })}
              {stats.lastFailureReason ? ` — ${stats.lastFailureReason}` : ""}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export function ChannelHealthPanel() {
  const { data, isLoading } = useChannelHealth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          Saúde dos canais externos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimos disparos de e-mail e WhatsApp acionados pelo monitor de metas de acurácia.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data && <ChannelRow stats={data.channels.email} />}
            {data && <ChannelRow stats={data.channels.whatsapp} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

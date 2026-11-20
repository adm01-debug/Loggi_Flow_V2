import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Loader2,
  CircleDashed,
} from "lucide-react";
import { useRemediationActions } from "@/features/db-observability/hooks/useRemediationActions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500 border-red-500/50",
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em tratamento",
  resolved: "Resolvido",
  ignored: "Ignorado",
};

export function PostMortemDashboard() {
  const { data: actions, isLoading, error } = useRemediationActions();

  const incidents =
    actions?.filter(
      (a) => a.severity === "critical" || a.severity === "warning",
    ) ?? [];

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando incidentes registrados…
      </div>
    );
  } else if (error) {
    body = (
      <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-sm text-destructive">
        Erro ao carregar incidentes reais.
      </div>
    );
  } else if (incidents.length === 0) {
    body = (
      <div className="p-10 rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 flex flex-col items-center justify-center text-center gap-3">
        <div className="p-4 rounded-2xl bg-primary/10">
          <CircleDashed className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-bold text-lg">Nenhum incidente registrado</h3>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Incidentes e ações de remediação detectadas pela automação de
          observabilidade aparecerão aqui automaticamente. Nenhum incidente
          ativo no momento.
        </p>
      </div>
    );
  } else {
    body = (
      <div className="grid gap-4">
        <AnimatePresence>
          {incidents.map((incident) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={
                        severityColors[incident.severity] ??
                        "bg-zinc-500/10 text-zinc-400"
                      }
                    >
                      {incident.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {incident.id.slice(0, 8)}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {statusLabel[incident.status] ?? incident.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                    {incident.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Aberto há{" "}
                      {formatDistanceToNow(new Date(incident.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                    {incident.resolved_at && (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolvido há{" "}
                        {formatDistanceToNow(new Date(incident.resolved_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-white/5">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Search className="h-3 w-3" /> Ação recomendada
                </p>
                <p className="text-sm text-zinc-400 italic">
                  "{incident.recommended_action ?? incident.detail}"
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">
            Central de Incidentes & Post-Mortems
          </h2>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() =>
            toast.info(
              "Novo relatório: disponível para admins via automação de remediação.",
            )
          }
        >
          <FileText className="h-4 w-4" /> Novo Relatório
        </Button>
      </div>

      {body}

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h4 className="font-bold">Cultura Blameless</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nossos post-mortems focam na melhoria de processos e sistemas, não
            na atribuição de culpa individual.
          </p>
        </div>
      </div>
    </div>
  );
}

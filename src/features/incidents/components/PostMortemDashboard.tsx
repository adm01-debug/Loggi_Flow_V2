import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Search,
  Plus,
} from "lucide-react";
import { IncidentReport } from "../types";
import { motion, AnimatePresence } from "framer-motion";

export function PostMortemDashboard() {
  const [incidents] = useState<IncidentReport[]>([
    {
      id: "INC-2026-001",
      title: "Latência Alta no Cálculo de Frete",
      severity: "high",
      status: "resolved",
      rootCause: "Subdimensionamento da Edge Function durante pico de demanda.",
      actionItems: [
        "Migrar para cache distribuído",
        "Ajustar limites de memória da função",
      ],
      startTime: "2026-05-12T14:20:00Z",
      resolvedAt: "2026-05-12T15:05:00Z",
      relatedTelemetryIds: ["TEL-123", "TEL-124"],
    },
    {
      id: "INC-2026-002",
      title: "Falha na Sincronização Rodonaves",
      severity: "critical",
      status: "identified",
      rootCause: "Alteração não documentada no schema da API de rastreamento.",
      actionItems: [
        "Implementar camada de validação de schema (Zod)",
        "Adicionar alerta de divergência de schema",
      ],
      startTime: "2026-05-16T08:00:00Z",
      relatedTelemetryIds: ["TEL-999"],
    },
  ]);

  const severityColors = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    high: "bg-orange-500/10 text-orange-500",
    critical: "bg-red-500/10 text-red-500 border-red-500/50",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">
            Central de Incidentes & Post-Mortems
          </h2>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Novo Relatório
        </Button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {incidents.map((incident) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={severityColors[incident.severity]}
                    >
                      {incident.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {incident.id}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                    {incident.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Início:{" "}
                      {new Date(incident.startTime).toLocaleString("pt-BR")}
                    </div>
                    {incident.resolvedAt && (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolvido em{" "}
                        {Math.round(
                          (new Date(incident.resolvedAt).getTime() -
                            new Date(incident.startTime).getTime()) /
                            60000,
                        )}
                        min
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Status
                    </p>
                    <p className="text-sm font-black">
                      {incident.status.toUpperCase()}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {incident.rootCause && (
                <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-white/5">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Search className="h-3 w-3" /> Root Cause Analysis
                  </p>
                  <p className="text-sm text-zinc-400 italic">
                    "{incident.rootCause}"
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {incident.actionItems.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px] font-medium bg-primary/5 text-primary border-primary/20"
                  >
                    Task: {item}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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

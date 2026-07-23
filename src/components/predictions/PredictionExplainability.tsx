import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Cloud, Truck, MapPin, Clock, CalendarDays, AlertOctagon, Timer, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PredictionFactor {
  nome: string;
  peso: number;
  impacto: "positivo" | "negativo" | "neutro";
  descricao?: string;
}

interface PredictionExplainabilityProps {
  fatores: PredictionFactor[];
}

const FACTOR_META: Record<string, { icon: LucideIcon; label: string; hint: string }> = {
  clima: { icon: Cloud, label: "Clima", hint: "Condições meteorológicas na rota" },
  historico_transportadora: { icon: Truck, label: "Histórico Transportadora", hint: "Performance recente do parceiro logístico" },
  distancia: { icon: MapPin, label: "Distância", hint: "Distância entre origem e destino" },
  horario: { icon: Clock, label: "Horário", hint: "Janela e horário do despacho" },
  sazonalidade: { icon: CalendarDays, label: "Sazonalidade", hint: "Picos e datas comemorativas" },
  ocorrencias_recentes: { icon: AlertOctagon, label: "Ocorrências Recentes", hint: "Incidentes registrados no período" },
  tempo_transito: { icon: Timer, label: "Tempo em Trânsito", hint: "Dias desde o despacho" },
};

const impactoClass = (impacto: PredictionFactor["impacto"]) => {
  if (impacto === "negativo") return "bg-destructive";
  if (impacto === "positivo") return "bg-success";
  return "bg-muted-foreground";
};

export function PredictionExplainability({ fatores }: PredictionExplainabilityProps) {
  if (!fatores || fatores.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Sem fatores explicativos disponíveis nesta predição.
      </p>
    );
  }

  const sorted = [...fatores].sort((a, b) => (b.peso || 0) - (a.peso || 0));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2">
        {sorted.map((f, idx) => {
          const meta = FACTOR_META[f.nome] ?? { icon: HelpCircle, label: f.nome, hint: f.descricao ?? f.nome };
          const Icon = meta.icon;
          const peso = Math.max(0, Math.min(100, Number(f.peso) || 0));
          return (
            <div key={`${f.nome}-${idx}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{meta.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label={`Sobre ${meta.label}`} className="text-muted-foreground/60 hover:text-muted-foreground">
                        <HelpCircle className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {f.descricao || meta.hint}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="tabular-nums font-semibold text-muted-foreground">{peso}%</span>
              </div>
              <Progress value={peso} className="h-1.5" indicatorClassName={impactoClass(f.impacto)} />
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

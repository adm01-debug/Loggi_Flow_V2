import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap, Clock, AlertCircle, ShieldCheck, ArrowUpRight } from "lucide-react";
import { DelayPrediction } from "@/hooks/logistics/useDelayPrediction";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrackingPredictiveInsightsProps {
  prediction: DelayPrediction | null;
  isLoading: boolean;
}

export function TrackingPredictiveInsights({ prediction, isLoading }: TrackingPredictiveInsightsProps) {
  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5 animate-pulse">
        <CardContent className="h-48 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary/40 animate-bounce" />
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Análise preditiva indisponível</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critico': return 'text-destructive';
      case 'alto': return 'text-orange-500';
      case 'medio': return 'text-yellow-500';
      case 'baixo': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'critico': return 'bg-destructive/10';
      case 'alto': return 'bg-orange-500/10';
      case 'medio': return 'bg-yellow-500/10';
      case 'baixo': return 'bg-success/10';
      default: return 'bg-muted';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <Card className="overflow-hidden border-primary/20 bg-black/40 backdrop-blur-xl shadow-2xl relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-24 h-24 text-primary" />
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 animate-pulse" />
              IA Predictive Insights
            </CardTitle>
            <Badge className={cn("rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest border-none", getRiskBg(prediction.risco), getRiskColor(prediction.risco))}>
              Risco: {prediction.risco}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Probabilidade de Atraso_SLA</p>
              <p className="text-xl font-black italic tracking-tighter text-white">{prediction.probabilidade_atraso}%</p>
            </div>
            <Progress value={prediction.probabilidade_atraso} className="h-1.5 bg-white/5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Deltas Estimados</p>
              <p className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                +{prediction.horas_estimadas_atraso}h
              </p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Status Protocolo</p>
              <p className="text-sm font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Protegido
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Motivos Identificados
            </p>
            <div className="flex flex-wrap gap-2">
              {prediction.motivos.map((motivo, i) => (
                <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-medium text-white/60 border border-white/5">
                  • {motivo}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 space-y-2 group cursor-pointer hover:bg-primary/20 transition-all">
            <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Ações Recomendadas_Nexus
            </p>
            <p className="text-[11px] text-white/70 font-medium italic leading-relaxed">
              {prediction.recomendacoes[0] || 'Nenhuma ação crítica necessária no momento.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
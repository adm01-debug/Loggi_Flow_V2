import { Star, TrendingUp, Clock, Truck, Trophy, Award, Crown, Zap, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Transportadora {
  id: string;
  nome_fantasia: string;
  score_performance: number | null;
  prazo_medio_dias: number | null;
  homologada: boolean;
}

interface TransportadoraRankingProps {
  transportadoras: Transportadora[];
  isLoading?: boolean;
}

export function TransportadoraRanking({ transportadoras, isLoading }: TransportadoraRankingProps) {
  const getRankStyles = (index: number) => {
    switch (index) {
      case 0:
        return {
          badge: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10',
          icon: Crown,
          iconColor: 'text-amber-500',
          particle: 'bg-amber-400'
        };
      case 1:
        return {
          badge: 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-slate-900 shadow-[0_0_20px_rgba(148,163,184,0.4)]',
          border: 'border-slate-400/40',
          bg: 'bg-slate-400/10',
          icon: Trophy,
          iconColor: 'text-slate-400',
          particle: 'bg-slate-300'
        };
      case 2:
        return {
          badge: 'bg-gradient-to-br from-orange-200 via-orange-400 to-orange-600 text-orange-950 shadow-[0_0_20px_rgba(249,115,22,0.4)]',
          border: 'border-orange-500/40',
          bg: 'bg-orange-500/10',
          icon: Award,
          iconColor: 'text-orange-500',
          particle: 'bg-orange-400'
        };
      default:
        return {
          badge: 'bg-white/10 text-white/70 border border-white/20',
          border: 'border-white/10',
          bg: 'bg-white/5',
          icon: ShieldCheck,
          iconColor: 'text-white/40',
          particle: 'bg-white/20'
        };
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-white/40';
    if (score >= 90) return 'text-success shadow-[0_0_15px_rgba(34,197,94,0.5)]';
    if (score >= 80) return 'text-primary shadow-[0_0_15px_rgba(234,56,76,0.5)]';
    if (score >= 60) return 'text-warning shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    return 'text-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  };

  if (isLoading) {
    return (
      <div className="h-full rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/10 p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/5 rounded-full animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded-full animate-pulse opacity-50" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-[2.5rem] bg-black/90 backdrop-blur-[50px] border border-white/10 p-8 shadow-2xl overflow-hidden group">
      {/* Dynamic Background Elements */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Scanning Line Effect */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan pointer-events-none" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-6">
          <div className="relative group/header-icon">
            <div className="absolute -inset-2 bg-primary/30 rounded-2xl blur-lg group-hover/header-icon:bg-primary/50 transition-all duration-700" />
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-black border border-primary/40 shadow-[0_0_20px_rgba(234,56,76,0.3)] group-hover/header-icon:rotate-12 transition-all duration-500">
              <Crown className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-black text-2xl sm:text-3xl leading-tight tracking-tighter bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent uppercase italic">
              Elite Logistics <span className="text-primary not-italic">Ranking</span>
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.3em] bg-primary/10 text-primary border-primary/30 px-3 py-1 rounded-full">
                Sincronização Ativa
              </Badge>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-success animate-pulse" /> Real-time KPI
              </span>
            </div>
          </div>
        </div>
      </div>

      {transportadoras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10 relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative p-6 rounded-full bg-black border border-white/10 mb-6 shadow-2xl">
            <Zap className="w-10 h-10 text-primary animate-bounce" />
          </div>
          <p className="text-lg font-black text-white uppercase italic tracking-tighter">Aguardando Frequência</p>
          <p className="text-xs text-white/40 mt-2 uppercase font-bold tracking-[0.2em]">Otimizando rede de transportadoras...</p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {transportadoras.map((transportadora, index) => {
            const styles = getRankStyles(index);
            const RankIcon = styles.icon;

            return (
              <motion.div
                key={transportadora.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.03, x: 8 }}
                className={cn(
                  "group/item relative flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden",
                  styles.border,
                  styles.bg,
                  index < 3 ? "shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-md" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                )}
              >
                {/* Ranking Particle Effect for top 3 */}
                {index < 3 && (
                  <div className={cn("absolute -right-2 -top-2 w-12 h-12 blur-2xl opacity-20", styles.particle)} />
                )}

                <div className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full text-lg font-black shadow-2xl shrink-0 transition-transform duration-500 group-hover/item:rotate-[360deg]",
                  styles.badge
                )}>
                  <RankIcon className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-base sm:text-lg truncate group-hover/item:text-primary transition-colors duration-300 uppercase italic tracking-tight text-white">
                      {transportadora.nome_fantasia}
                    </p>
                    {transportadora.homologada && (
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0 drop-shadow-[0_0_5px_rgba(234,56,76,0.5)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-widest shadow-inner">
                      <Clock className="w-3 h-3 text-primary" />
                      {transportadora.prazo_medio_dias || '-'} DIAS MÉDIOS
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Star className={cn("w-6 h-6", getScoreColor(transportadora.score_performance))} />
                      <div className={cn("absolute inset-0 blur-md opacity-50", getScoreColor(transportadora.score_performance))} />
                    </div>
                    <span className={cn(
                      "text-3xl font-black tabular-nums tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]",
                      getScoreColor(transportadora.score_performance)
                    )}>
                      {transportadora.score_performance ?? 0}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-0.5 mr-1">Nexus Score</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer Branding */}
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity duration-700">
        <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Audit Logs Active</span>
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-primary/40 rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
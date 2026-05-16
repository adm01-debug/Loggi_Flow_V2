import { Star, TrendingUp, Clock, Truck, Trophy, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
          badge: 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 shadow-amber-500/40',
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/5',
          icon: Trophy,
          iconColor: 'text-amber-500'
        };
      case 1:
        return {
          badge: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-800 shadow-slate-400/30',
          border: 'border-slate-400/30',
          bg: 'bg-slate-400/5',
          icon: Award,
          iconColor: 'text-slate-400'
        };
      case 2:
        return {
          badge: 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600 text-orange-950 shadow-orange-500/40',
          border: 'border-orange-500/30',
          bg: 'bg-orange-500/5',
          icon: Award,
          iconColor: 'text-orange-500'
        };
      default:
        return {
          badge: 'bg-muted text-muted-foreground',
          border: 'border-border/50',
          bg: 'transparent',
          icon: null,
          iconColor: 'text-muted-foreground'
        };
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (isLoading) {
    return (
      <div className="card-base p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 animate-pulse" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-base p-6 sm:p-8 border-none shadow-2xl bg-gradient-to-br from-card via-card to-card-elevated/50 relative overflow-hidden group">
      {/* Decorative background gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-500 ring-1 ring-primary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl sm:text-2xl leading-none tracking-tight">Elite de Performance</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-[0.3em] font-black opacity-60">Top Transportadoras</p>
          </div>
        </div>
      </div>

      {transportadoras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-[2rem] border border-dashed border-border relative z-10">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 shadow-inner">
            <Truck className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Aguardando dados</p>
          <p className="text-xs text-muted-foreground mt-1">Sua rede logística aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {transportadoras.map((transportadora, index) => {
            const styles = getRankStyles(index);
            const RankIcon = styles.icon;

            return (
              <motion.div
                key={transportadora.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className={cn(
                  "group/item flex items-center gap-4 p-4 rounded-[1.5rem] border-2 transition-all duration-300 shadow-sm hover:shadow-xl",
                  styles.border,
                  styles.bg,
                  index < 3 ? "backdrop-blur-sm" : "bg-card/40"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full text-base font-black shadow-lg shrink-0",
                  styles.badge
                )}>
                  {RankIcon ? <RankIcon className="w-5 h-5" /> : index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm sm:text-base truncate group-hover/item:text-primary transition-colors">{transportadora.nome_fantasia}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                      <Clock className="w-3 h-3" />
                      {transportadora.prazo_medio_dias || '-'} DIAS
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <Star className={cn("w-5 h-5 drop-shadow-[0_0_8px_currentColor]", getScoreColor(transportadora.score_performance))} />
                    <span className={cn(
                      "text-xl sm:text-2xl font-black tabular-nums tracking-tighter",
                      getScoreColor(transportadora.score_performance)
                    )}>
                      {transportadora.score_performance ?? 0}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">SCORE KPI</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
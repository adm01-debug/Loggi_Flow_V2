import { Star, TrendingUp, Clock, Truck } from "lucide-react";
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
          badge: 'rank-gold',
          border: 'border-[hsl(var(--rank-gold))]/30',
        };
      case 1:
        return {
          badge: 'rank-silver',
          border: 'border-[hsl(var(--rank-silver))]/30',
        };
      case 2:
        return {
          badge: 'rank-bronze',
          border: 'border-[hsl(var(--rank-bronze))]/30',
        };
      default:
        return {
          badge: 'bg-muted text-muted-foreground',
          border: 'border-border',
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
      <div className="card-base">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Top Transportadoras</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">Top Transportadoras</h3>
        </div>
      </div>

      {transportadoras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Truck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma transportadora cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transportadoras.map((transportadora, index) => {
            const styles = getRankStyles(index);

            return (
              <motion.div
                key={transportadora.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-muted/50",
                  styles.border
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                  styles.badge
                )}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{transportadora.nome_fantasia}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {transportadora.prazo_medio_dias || '-'} dias
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className={cn("w-4 h-4", getScoreColor(transportadora.score_performance))} />
                    <span className={cn(
                      "text-lg font-bold",
                      getScoreColor(transportadora.score_performance)
                    )}>
                      {transportadora.score_performance ?? 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Truck, 
  Package, 
  ChevronRight, 
  Sparkles,
  HeartPulse,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLogisticsIntelligence } from "@/hooks/useLogisticsIntelligence";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  truck: Truck,
  package: Package,
  "trending-up": TrendingUp,
};

export function IntelligentLogisticsWidget() {
  const { healthScore, optimizations } = useLogisticsIntelligence();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success border-success/30 bg-success/5";
    if (score >= 70) return "text-warning border-warning/30 bg-warning/5";
    return "text-destructive border-destructive/30 bg-destructive/5";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Saudável";
    if (score >= 70) return "Atenção";
    return "Crítico";
  };

  return (
    <Card className="relative overflow-hidden group border-none bg-transparent p-[2px] rounded-[2rem] shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-white/5 to-primary/10 rounded-[2rem]" />
      <div className="relative h-full bg-black/90 backdrop-blur-3xl rounded-[1.9rem] p-6 sm:p-8">
        <CardHeader className="p-0 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black italic tracking-tighter bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent uppercase">
                  Nexus Intelligence
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">
                  Métricas de Saúde Operacional
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={cn("font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2", getScoreColor(healthScore))}>
              {getScoreLabel(healthScore)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-10">
          {/* Health Score */}
          <div className="relative p-6 rounded-[1.5rem] bg-white/5 border border-white/10 overflow-hidden group/score">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/score:opacity-100 transition-opacity duration-500" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <HeartPulse className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Health Score Global</span>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5 tracking-tighter">
                      OTIF • RISCOS • OCORRÊNCIAS
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-primary italic leading-none drop-shadow-[0_0_15px_rgba(234,56,76,0.3)]">{healthScore}%</span>
                </div>
              </div>
              <div className="relative">
                <Progress value={healthScore} className="h-3 bg-white/5 rounded-full border border-white/5" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent blur-sm -z-10" />
              </div>
            </div>
          </div>

          {/* Optimizations */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(234,56,76,0.5)]" />
              <div className="text-sm font-black uppercase tracking-[0.3em] text-white">
                IA: OTIMIZAÇÕES RECOMENDADAS
              </div>
            </div>
            
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {optimizations.map((opt, i) => {
                  const Icon = iconMap[opt.icon] || Zap;
                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group/opt relative p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer overflow-hidden shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                      
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover/opt:scale-110 group-hover/opt:rotate-3 transition-transform">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-black text-base italic tracking-tight uppercase group-hover/opt:text-primary transition-colors">{opt.title}</h4>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-[9px] h-5 px-3 uppercase font-black border-none",
                                opt.impact === 'Alta' ? "bg-primary text-white shadow-[0_0_10px_rgba(234,56,76,0.4)]" : "bg-white/10 text-white/70"
                              )}
                            >
                              {opt.impact} IMPACTO
                            </Badge>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed line-clamp-2 font-medium">
                            {opt.description}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-4 h-9 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-white border border-primary/30 rounded-full gap-2 transition-all"
                          >
                            Implementar Estratégia <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/30 flex items-center justify-between group/footer hover:scale-[1.02] transition-transform shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-widest">IA EM TEMPO REAL</span>
                <p className="text-[10px] font-bold text-primary/80 uppercase">Nova oportunidade identificada</p>
              </div>
            </div>
            <Button size="sm" className="h-10 px-6 text-[10px] font-black bg-primary text-white hover:bg-primary/80 rounded-full shadow-[0_0_20px_rgba(234,56,76,0.4)] uppercase tracking-widest">
              REVISAR AGORA
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

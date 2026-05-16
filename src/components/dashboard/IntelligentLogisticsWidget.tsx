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
    <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Inteligência Operacional</CardTitle>
          </div>
          <Badge variant="outline" className={cn("font-bold uppercase tracking-tighter", getScoreColor(healthScore))}>
            {getScoreLabel(healthScore)}
          </Badge>
        </div>
        <CardDescription>
          Métricas de saúde logística e otimizações propostas por IA
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Health Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Logistics Health Score</span>
            </div>
            <span className="text-2xl font-black text-primary">{healthScore}%</span>
          </div>
          <Progress value={healthScore} className="h-2 bg-primary/10" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Baseado em OTIF, Risco de Atraso e Ocorrências
          </p>
        </div>

        {/* Optimizations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <Lightbulb className="h-4 w-4" />
            Otimizações Sugeridas
          </div>
          
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {optimizations.map((opt, i) => {
                const Icon = iconMap[opt.icon] || Zap;
                return (
                  <motion.div
                    key={opt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm truncate">{opt.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[8px] h-4 uppercase font-black",
                              opt.impact === 'Alta' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {opt.impact} Impacto
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {opt.description}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 h-7 px-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 gap-1"
                        >
                          Aplicar Otimização <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary">Nova estratégia de carga identificada</span>
          </div>
          <Button size="sm" className="h-7 text-[10px] font-black bg-primary text-primary-foreground hover:bg-primary/90">
            Revisar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

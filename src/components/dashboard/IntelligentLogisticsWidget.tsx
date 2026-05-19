import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  TrendingUp, 
  Truck, 
  Package, 
  ChevronRight, 
  HeartPulse,
  Brain,
  Cpu,
  Fingerprint,
  Radio
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLogisticsIntelligence } from "@/hooks/useLogisticsIntelligence";
import { cn } from "@/lib/utils";
import { BiometricConsentModal } from "./BiometricConsentModal";

const iconMap: Record<string, any> = {
  truck: Truck,
  package: Package,
  "trending-up": TrendingUp,
};

export function IntelligentLogisticsWidget() {
  const { healthScore, optimizations } = useLogisticsIntelligence();
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isBiometricAuthorized, setIsBiometricAuthorized] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success border-success/30 bg-success/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
    if (score >= 70) return "text-warning border-warning/30 bg-warning/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
    return "text-destructive border-destructive/30 bg-destructive/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Supremacia Operacional";
    if (score >= 70) return "Monitoramento Tático";
    return "Intervenção Crítica";
  };

  return (
    <Card className="relative overflow-hidden group border-none bg-transparent p-[2px] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl h-full min-h-[700px]">
      {/* Bio-Organic Neural Network Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,56,76,0.15),transparent_70%)] animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-white/5 to-primary/10 rounded-[1.5rem] sm:rounded-[2.5rem]" />
      
      <div className="relative h-full bg-black/95 backdrop-blur-[50px] rounded-[1.4rem] sm:rounded-[2.4rem] p-6 sm:p-8 flex flex-col border border-white/5">
        
        {/* Scanning Header Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-scan" />

        <CardHeader className="p-0 mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group/icon">
                <div className="absolute -inset-2 bg-primary/20 rounded-2xl blur-lg group-hover/icon:bg-primary/40 transition-all duration-500" />
                <div className="relative p-3 sm:p-4 rounded-[1.25rem] sm:rounded-2xl bg-black border border-primary/40 shadow-[0_0_20px_rgba(234,56,76,0.3)] group-hover/icon:scale-110 group-hover/icon:rotate-6 transition-all">
                  <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent uppercase leading-tight">
                  Neural Core <span className="text-primary italic">X9</span>
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 mt-1 flex items-center gap-2">
                  <Radio className="w-3 h-3 animate-ping" /> Sincronização Bio-Digital Ativa
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Badge variant="outline" className={cn("font-black text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 rounded-full border-2 transition-all duration-700", getScoreColor(healthScore))}>
                {getScoreLabel(healthScore)}
              </Badge>
              <span className="text-[8px] font-black text-white/30 uppercase mt-2 tracking-widest flex items-center gap-1">
                <Cpu className="w-2 h-2" /> Kernel: 2.0.Nexus
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col space-y-12">
          {/* Advanced Health Matrix */}
          <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden group/score shadow-inner">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] group-hover/score:bg-primary/20 transition-all duration-1000" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center border border-primary/30 shadow-[inset_0_0_10px_rgba(234,56,76,0.2)]">
                    <HeartPulse className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Eficiência de Rede</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={cn("w-1 h-3 rounded-full", i <= 4 ? "bg-primary shadow-[0_0_5px_rgba(234,56,76,0.5)]" : "bg-white/10")} />
                        ))}
                      </div>
                      <p className="text-[10px] text-primary uppercase font-black tracking-tighter">
                        OTIF • SLA • LATÊNCIA
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="relative inline-block">
                    <span className="text-6xl font-black text-white italic tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{healthScore}</span>
                    <span className="text-2xl font-black text-primary italic ml-1">%</span>
                  </div>
                </div>
              </div>
              
              <div className="relative pt-2">
                <div className="flex justify-between text-[8px] font-black text-white/30 uppercase mb-2 tracking-widest px-1">
                  <span>0%</span>
                  <span>Setor Operacional</span>
                  <span>100%</span>
                </div>
                <div className="h-4 w-full bg-black/40 rounded-full border border-white/10 p-[2px] relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/60 relative"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Intelligent Insights Feed */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="w-3 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(234,56,76,0.6)] animate-pulse" />
                <div className="text-base font-black uppercase tracking-[0.4em] text-white italic">
                  Neural Insights
                </div>
              </div>
              <Badge className="bg-white/5 text-[8px] font-black text-white/40 border-white/10 uppercase py-1 px-3">
                {optimizations.length} Pendentes
              </Badge>
            </div>
            
            <div className="grid gap-5">
              <AnimatePresence mode="popLayout">
                {optimizations.map((opt, i) => {
                  const Icon = iconMap[opt.icon] || Zap;
                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                      className="group/opt relative p-6 rounded-3xl border border-white/5 bg-gradient-to-r from-white/5 to-transparent hover:from-primary/10 hover:to-primary/5 hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-xl"
                    >
                      <div className="flex items-start gap-6 relative z-10">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 blur-md rounded-2xl group-hover/opt:scale-150 transition-transform" />
                          <div className="relative p-4 rounded-2xl bg-black text-primary border border-primary/20 group-hover/opt:bg-primary group-hover/opt:text-white transition-all duration-500 shadow-2xl">
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h4 className="font-black text-lg italic tracking-tighter uppercase group-hover/opt:text-primary transition-colors duration-300">{opt.title}</h4>
                            <Badge 
                              className={cn(
                                "text-[9px] h-6 px-4 uppercase font-black border-none tracking-widest",
                                opt.impact === 'Alta' ? "bg-primary text-white shadow-[0_0_20px_rgba(234,56,76,0.5)]" : "bg-white/10 text-white/60"
                              )}
                            >
                              Impacto {opt.impact}
                            </Badge>
                          </div>
                          <p className="text-[13px] text-white/50 leading-relaxed font-medium group-hover/opt:text-white/80 transition-colors">
                            {opt.description}
                          </p>
                          <div className="mt-5 flex items-center justify-between">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-10 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-white border-2 border-primary/20 rounded-full gap-3 transition-all active:scale-95"
                            >
                              Iniciar Processamento <ChevronRight className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                              <span className="text-[9px] font-black text-primary uppercase">Alpha 1.0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Hyper-Visual Footer CTA */}
          <div className="relative p-6 rounded-[2rem] bg-black border-2 border-primary/30 overflow-hidden group/footer hover:border-primary transition-all duration-700 shadow-[0_0_40px_rgba(234,56,76,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent animate-shimmer" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-hover/footer:rotate-[360deg] transition-transform duration-1000">
                  <Fingerprint className="h-7 w-7 text-primary animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-[0.3em]">IA Consciência Ativa</span>
                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter mt-1">Sincronize sua biometria para autorizar otimizações</p>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={() => setIsBiometricOpen(true)}
                disabled={isBiometricAuthorized}
                className={cn(
                  "w-full sm:w-auto h-12 px-10 text-[11px] font-black uppercase tracking-[0.2em] transition-all group-hover/footer:px-12 rounded-full",
                  isBiometricAuthorized 
                    ? "bg-success text-white cursor-default" 
                    : "bg-primary text-white hover:bg-white hover:text-primary shadow-[0_0_30px_rgba(234,56,76,0.5)]"
                )}
              >
                {isBiometricAuthorized ? "SINCRONIZADO" : "SINCRONIZAR AGORA"}
              </Button>
            </div>
          </div>
        </CardContent>
      </div>

      <BiometricConsentModal 
        isOpen={isBiometricOpen} 
        onClose={() => setIsBiometricOpen(false)} 
        onConfirm={() => setIsBiometricAuthorized(true)} 
      />
    </Card>
  );
}

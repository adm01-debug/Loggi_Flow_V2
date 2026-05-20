import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Clock, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function MapIntelligenceOverlay() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 z-10 w-64 space-y-3 pointer-events-none"
    >
      <Card className="bg-black/80 backdrop-blur-2xl border-white/10 shadow-2xl pointer-events-auto overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 animate-pulse" />
            Nexus_AI_Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Otimização_Global</span>
              <Badge className="bg-cyan-500/10 text-cyan-400 text-[8px] font-black border-none">98.4%</Badge>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '98.4%' }}
                className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-2 h-2" /> Tráfego
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white italic">FLUIDO</span>
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-cyan-500/50 rounded-full" />
                  <div className="w-1 h-2 bg-cyan-500/30 rounded-full mt-auto" />
                  <div className="w-1 h-4 bg-cyan-500 rounded-full mt-auto" />
                </div>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-2 h-2" /> Clima
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white italic">ESTÁVEL</span>
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-3 h-3 animate-bounce" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Fluxo Intenso em Rota B-12</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-500">
              <Zap className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Re-roteamento Otimizado via Nexus</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/80 backdrop-blur-2xl border-white/10 shadow-2xl pointer-events-auto">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-success animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">SLA_Fulfillment</p>
              <p className="text-xs font-black text-white italic">STATUS: NOMINAL</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

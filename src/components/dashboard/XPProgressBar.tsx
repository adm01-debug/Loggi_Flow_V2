import * as React from "react";
import { Zap, Crown, Star, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  className?: string;
}

export function XPProgressBar({ currentXP, nextLevelXP, level, className }: XPProgressBarProps) {
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative overflow-hidden group p-[2px] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl", className)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-white/5 to-primary/10 rounded-[1.5rem] sm:rounded-[2.5rem]" />
      <div className="relative h-full bg-black/95 backdrop-blur-[50px] rounded-[1.4rem] sm:rounded-[2.4rem] p-6 sm:p-8 flex flex-col gap-6 sm:gap-8 border border-white/5">
        
        {/* Scanning Line Effect */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-scan" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6 min-w-0">
            <div className="relative group/rank">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover/rank:bg-primary/40 transition-all duration-700" />
              <div className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[1.75rem] bg-black border-2 border-primary/40 shadow-[0_0_30px_rgba(234,56,76,0.3)] shrink-0 group-hover:rotate-12 transition-all duration-500">
                <Crown className="w-7 h-7 sm:w-10 sm:h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary border-2 border-black flex items-center justify-center shadow-xl">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                 <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[9px] font-black uppercase tracking-widest px-3">Elite_Level_Alpha</Badge>
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-1.5"><Activity className="w-2.5 h-2.5" /> Frequência de Rede Ativa</span>
              </div>
              <h2 className="font-black italic text-2xl sm:text-5xl tracking-tighter text-white uppercase leading-none bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">Nível {level}</h2>
              <p className="text-xs font-black text-primary/80 mt-3 uppercase tracking-[0.4em] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Comandante Nexus de Perímetro
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-6xl font-black italic text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{currentXP.toLocaleString()}</span>
              <span className="text-xl font-black text-primary italic">XP</span>
            </div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
              Sincronização em curso <ArrowUpRight className="w-3 h-3" />
              <span className="text-white/60">META: {nextLevelXP.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-[0.3em] px-2 mb-1">
            <span>0% Estabilidade</span>
            <span>100% Evolução</span>
          </div>
          <div className="h-6 w-full bg-black/60 rounded-full border-2 border-white/10 overflow-hidden p-[3px] relative shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 2, ease: "circOut" }}
              className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_30px_rgba(234,56,76,0.6)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.3)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.3)_50%,rgba(255,255,255,0.3)_75%,transparent_75%,transparent)] bg-[length:30px_30px] animate-[shimmer_2s_linear_infinite]" />
            </motion.div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10 group-hover:border-primary/30 transition-all duration-500">
              <Zap className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80 italic">
                Faltam <span className="text-primary text-sm font-black">{(nextLevelXP - currentXP).toLocaleString()}</span> XP para o próximo estágio de comando
              </span>
            </div>
            <div className="relative group/percent">
               <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover/percent:opacity-100 transition-opacity" />
               <span className="relative font-black italic text-primary text-2xl tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(234,56,76,0.4)]">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

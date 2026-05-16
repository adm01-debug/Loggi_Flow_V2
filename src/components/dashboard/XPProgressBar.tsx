import * as React from "react";
import { Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  currentXP: number;
  nextLevelXP: number;
  level: number;
}

const XPProgressBar = React.forwardRef<HTMLDivElement, XPProgressBarProps>(
  ({ currentXP, nextLevelXP, level, className, ...props }, ref) => {
    const progress = (currentXP / nextLevelXP) * 100;

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden group p-[1px] rounded-[1.5rem] shadow-2xl", className)}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-white/5 to-white/10 rounded-[1.5rem]" />
        <div className="relative h-full bg-black/90 backdrop-blur-3xl rounded-[1.4rem] p-5 space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors duration-500" />
          
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_20px_rgba(234,56,76,0.5)] ring-1 ring-white/20 shrink-0 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-black italic text-2xl tracking-tighter text-white uppercase leading-none">Nível {level}</p>
                <p className="text-[10px] font-black text-primary/80 mt-1 uppercase tracking-[0.3em]">Operador Nexus Elite</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black italic text-3xl text-primary leading-none drop-shadow-[0_0_10px_rgba(234,56,76,0.3)]">
                {currentXP.toLocaleString()}
              </p>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">
                / {nextLevelXP.toLocaleString()} XP
              </p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="h-4 w-full bg-white/5 rounded-full border border-white/10 overflow-hidden p-[2px]">
              <div
                className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-primary via-primary to-primary shadow-[0_0_15px_rgba(234,56,76,0.6)]"
                style={{ width: `${progress}%`, transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-shimmer" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/60">
                <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>{nextLevelXP - currentXP} XP para o próximo estágio de poder</span>
              </span>
              <span className="font-black italic text-primary text-sm">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
XPProgressBar.displayName = "XPProgressBar";

export { XPProgressBar };

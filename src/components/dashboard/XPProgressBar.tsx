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
        className={cn("card-elevated p-3 sm:p-4 space-y-2 sm:space-y-3 relative overflow-hidden group", className)}
        {...props}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-xp/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-xp/10 transition-colors duration-500" />
        
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-xp to-primary glow-primary shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-base sm:text-lg">Nível {level}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Operador Experiente</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display font-bold text-lg sm:text-xl text-xp">
              {currentXP.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              / {nextLevelXP.toLocaleString()} XP
            </p>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 relative z-10">
          <div className="xp-bar">
            <div
              className="xp-bar-fill relative overflow-hidden shadow-[0_0_15px_rgba(var(--xp-rgb),0.5)]"
              style={{ width: `${progress}%`, transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap className="w-3 h-3 text-xp" />
              <span className="hidden sm:inline">{nextLevelXP - currentXP} XP para o próximo nível</span>
              <span className="sm:hidden">{nextLevelXP - currentXP} XP restante</span>
            </span>
            <span className="font-medium text-xp">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    );
  }
);
XPProgressBar.displayName = "XPProgressBar";

export { XPProgressBar };

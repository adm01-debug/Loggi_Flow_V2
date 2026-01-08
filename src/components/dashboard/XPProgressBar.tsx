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
        className={cn("card-elevated p-3 sm:p-4 space-y-2 sm:space-y-3", className)}
        {...props}
      >
        <div className="flex items-center justify-between gap-2">
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

        <div className="space-y-1.5 sm:space-y-2">
          <div className="xp-bar">
            <div
              className="xp-bar-fill relative overflow-hidden"
              style={{ width: `${progress}%` }}
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

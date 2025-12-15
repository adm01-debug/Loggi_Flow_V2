import { Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  className?: string;
}

export function XPProgressBar({
  currentXP,
  nextLevelXP,
  level,
  className,
}: XPProgressBarProps) {
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <div
      className={cn(
        "card-elevated p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-xp to-primary glow-primary">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-lg">Nível {level}</p>
            <p className="text-sm text-muted-foreground">Operador Experiente</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-xl text-xp">
            {currentXP.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            / {nextLevelXP.toLocaleString()} XP
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="xp-bar">
          <div
            className="xp-bar-fill relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-3 h-3 text-xp" />
            {nextLevelXP - currentXP} XP para o próximo nível
          </span>
          <span className="font-medium text-xp">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Zap, Coins, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LevelBadge, LevelTierBadge } from "./LevelBadge";
import { useGamification } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";

interface XPProgressCardProps {
  className?: string;
  compact?: boolean;
}

export function XPProgressCard({ className, compact = false }: XPProgressCardProps) {
  const { userLevel, levelProgress, isLoading } = useGamification();

  if (isLoading) {
    return (
      <div className={cn("card-elevated", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!userLevel) return null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <LevelBadge level={levelProgress.currentLevel} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Nível {levelProgress.currentLevel}</span>
            <span className="text-xp font-medium">{levelProgress.currentLevelXP}/{levelProgress.nextLevelXP} XP</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--gradient-xp)" }}
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("card-elevated", className)}
    >
      <div className="flex items-start gap-4">
        <LevelBadge level={levelProgress.currentLevel} size="lg" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-lg">Nível {levelProgress.currentLevel}</h3>
            <LevelTierBadge level={levelProgress.currentLevel} />
          </div>
          
          <div className="space-y-3">
            {/* XP Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-1.5 text-xp">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">{userLevel.total_xp.toLocaleString()} XP Total</span>
                </div>
                <span className="text-muted-foreground">
                  {levelProgress.currentLevelXP}/{levelProgress.nextLevelXP} XP
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{ background: "var(--gradient-xp)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Faltam {levelProgress.nextLevelXP - levelProgress.currentLevelXP} XP para o próximo nível
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-coins" />
                <span className="font-semibold text-coins">{userLevel.coins.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-streak" />
                <span className="font-semibold text-streak">{userLevel.streak_days} dias</span>
              </div>
              
              <div className="flex items-center gap-1.5 ml-auto">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">+{Math.round(levelProgress.progress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

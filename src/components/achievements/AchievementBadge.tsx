import { motion } from "framer-motion";
import { Lock, Zap, Coins, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export interface AchievementBadgeData {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  coinsReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export const rarityConfig = {
  common: {
    border: "border-muted-foreground/30",
    bg: "bg-muted/30",
    glow: "",
    label: "Comum",
    labelColor: "text-muted-foreground",
  },
  rare: {
    border: "border-info/50",
    bg: "bg-info/10",
    glow: "shadow-[0_0_15px_hsl(var(--info)/0.3)]",
    label: "Raro",
    labelColor: "text-info",
  },
  epic: {
    border: "border-primary/50",
    bg: "bg-primary/10",
    glow: "shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
    label: "Épico",
    labelColor: "text-primary",
  },
  legendary: {
    border: "border-coins/50",
    bg: "bg-coins/10",
    glow: "shadow-[0_0_25px_hsl(var(--coins)/0.5)]",
    label: "Lendário",
    labelColor: "text-coins",
  },
};

interface AchievementBadgeProps {
  achievement: AchievementBadgeData;
  compact?: boolean;
  onClick?: () => void;
}

export function AchievementBadge({ achievement, compact, onClick }: AchievementBadgeProps) {
  const config = rarityConfig[achievement.rarity];
  const Icon = achievement.icon;
  const progress = achievement.progress && achievement.maxProgress
    ? (achievement.progress / achievement.maxProgress) * 100
    : 0;

  if (compact) {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer min-w-[200px]",
          config.border,
          config.bg,
          achievement.unlocked && config.glow
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            achievement.unlocked ? config.bg : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              achievement.unlocked ? config.labelColor : "text-muted-foreground"
            )}
          />
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm">{achievement.name}</p>
          <p className={cn("text-xs", config.labelColor)}>{config.label}</p>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer w-full text-center",
        config.border,
        achievement.unlocked ? config.bg : "bg-card",
        achievement.unlocked && config.glow,
        !achievement.unlocked && "opacity-70"
      )}
    >
      {/* Rarity Badge */}
      <span
        className={cn(
          "absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full",
          config.bg,
          config.labelColor
        )}
      >
        {config.label}
      </span>

      {/* Icon */}
      <div className="relative mb-4">
        <motion.div
          animate={achievement.unlocked ? {
            boxShadow: [
              "0 0 0 0 hsl(var(--primary) / 0)",
              "0 0 20px 10px hsl(var(--primary) / 0.2)",
              "0 0 0 0 hsl(var(--primary) / 0)",
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-2xl",
            achievement.unlocked
              ? `${config.bg} border-2 ${config.border}`
              : "bg-muted border-2 border-muted-foreground/20"
          )}
        >
          {achievement.unlocked ? (
            <Icon className={cn("w-8 h-8", config.labelColor)} />
          ) : (
            <Lock className="w-8 h-8 text-muted-foreground" />
          )}
        </motion.div>

        {/* Sparkle effect for unlocked */}
        {achievement.unlocked && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <div className="w-4 h-4 bg-coins rounded-full" />
          </motion.div>
        )}
      </div>

      {/* Name & Description */}
      <h4 className="font-display font-semibold text-lg mb-1">{achievement.name}</h4>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {achievement.description}
      </p>

      {/* Progress or Rewards */}
      {!achievement.unlocked && achievement.progress !== undefined ? (
        <div className="w-full space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {achievement.progress} / {achievement.maxProgress}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-xp" />
            <span className="text-sm font-semibold text-xp">+{achievement.xpReward}</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-coins" />
            <span className="text-sm font-semibold text-coins">+{achievement.coinsReward}</span>
          </div>
        </div>
      )}

      {/* Unlocked date */}
      {achievement.unlocked && achievement.unlockedAt && (
        <p className="text-xs text-muted-foreground mt-3">
          Desbloqueado em {achievement.unlockedAt.toLocaleDateString("pt-BR")}
        </p>
      )}
    </motion.button>
  );
}

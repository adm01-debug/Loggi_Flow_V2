import { motion } from "framer-motion";
import { Lock, cn } from "@/lib/utils";
import { AchievementBadgeData, rarityConfig } from "./AchievementBadge";

interface CompactAchievementBadgeProps {
  achievement: AchievementBadgeData;
  config: typeof rarityConfig['common'];
  onClick?: () => void;
}

export function CompactAchievementBadge({ achievement, config, onClick }: CompactAchievementBadgeProps) {
  const Icon = achievement.icon;
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

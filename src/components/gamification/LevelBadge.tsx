import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
  className?: string;
}

const levelTiers = [
  { min: 1, max: 4, name: "Bronze", gradient: "from-amber-700 to-amber-900", glow: "shadow-amber-700/40" },
  { min: 5, max: 9, name: "Prata", gradient: "from-gray-300 to-gray-500", glow: "shadow-gray-400/40" },
  { min: 10, max: 14, name: "Ouro", gradient: "from-yellow-400 to-amber-500", glow: "shadow-yellow-500/50" },
  { min: 15, max: 19, name: "Platina", gradient: "from-cyan-300 to-cyan-500", glow: "shadow-cyan-400/50" },
  { min: 20, max: 24, name: "Diamante", gradient: "from-blue-400 to-purple-500", glow: "shadow-blue-500/50" },
  { min: 25, max: 29, name: "Mestre", gradient: "from-purple-500 to-pink-500", glow: "shadow-purple-500/50" },
  { min: 30, max: Infinity, name: "Lenda", gradient: "from-orange-400 via-red-500 to-purple-600", glow: "shadow-orange-500/60" },
];

function getTierForLevel(level: number) {
  return levelTiers.find(t => level >= t.min && level <= t.max) || levelTiers[0];
}

export function LevelBadge({ level, size = "md", showGlow = true, className }: LevelBadgeProps) {
  const tier = getTierForLevel(level);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "relative flex items-center justify-center rounded-xl font-display font-bold text-white",
        `bg-gradient-to-br ${tier.gradient}`,
        showGlow && `shadow-lg ${tier.glow}`,
        sizeClasses[size],
        className
      )}
    >
      <span>{level}</span>
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden"
        initial={false}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
          animate={{
            x: ["-200%", "200%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export function LevelTierBadge({ level, className }: { level: number; className?: string }) {
  const tier = getTierForLevel(level);
  
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r text-white",
        tier.gradient,
        className
      )}
    >
      {tier.name}
    </span>
  );
}

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Coins, Sparkles, X, LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AchievementDisplay {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  coinsReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

const rarityConfig = {
  common: {
    gradient: "from-muted-foreground/20 to-muted/30",
    glow: "shadow-[0_0_60px_20px_hsl(var(--muted-foreground)/0.2)]",
    label: "Comum",
    labelColor: "text-muted-foreground",
  },
  rare: {
    gradient: "from-info/30 to-info/10",
    glow: "shadow-[0_0_60px_20px_hsl(var(--info)/0.3)]",
    label: "Raro",
    labelColor: "text-info",
  },
  epic: {
    gradient: "from-primary/30 to-primary/10",
    glow: "shadow-[0_0_80px_30px_hsl(var(--primary)/0.4)]",
    label: "Épico",
    labelColor: "text-primary",
  },
  legendary: {
    gradient: "from-coins/30 to-coins/10",
    glow: "shadow-[0_0_100px_40px_hsl(var(--coins)/0.5)]",
    label: "Lendário",
    labelColor: "text-coins",
  },
};

interface AchievementUnlockModalProps {
  achievement: AchievementDisplay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confetti particle component
function Confetti() {
  const particles = Array.from({ length: 50 });
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--xp))",
    "hsl(var(--coins))",
    "hsl(var(--success))",
    "hsl(var(--info))",
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: "50%",
            y: "50%",
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: [0, 1, 0.5],
            opacity: [1, 1, 0],
            rotate: Math.random() * 720,
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: Math.random() * 0.3,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: 8 + Math.random() * 8,
            height: 8 + Math.random() * 8,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

// Sparkle burst component
function SparkleBurst() {
  const sparkles = Array.from({ length: 12 });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sparkles.map((_, i) => {
        const angle = (i / 12) * 360;
        const radians = (angle * Math.PI) / 180;
        const distance = 120;
        const x = Math.cos(radians) * distance;
        const y = Math.sin(radians) * distance;

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x,
              y,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.8,
              delay: 0.2 + i * 0.03,
              ease: "easeOut",
            }}
            className="absolute"
          >
            <Sparkles className="w-6 h-6 text-coins" />
          </motion.div>
        );
      })}
    </div>
  );
}

export function AchievementUnlockModal({
  achievement,
  open,
  onOpenChange,
}: AchievementUnlockModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && achievement?.unlocked) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [open, achievement]);

  if (!achievement) return null;

  const config = rarityConfig[achievement.rarity];
  const Icon = achievement.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden border-0 bg-transparent shadow-none">
        <DialogTitle className="sr-only">Conquista Desbloqueada</DialogTitle>
        
        <AnimatePresence>
          {showConfetti && <Confetti />}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={cn(
            "relative flex flex-col items-center p-8 rounded-3xl bg-card border-2",
            `border-${achievement.rarity === "legendary" ? "coins" : achievement.rarity === "epic" ? "primary" : achievement.rarity === "rare" ? "info" : "muted"}/50`,
            config.glow
          )}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Background gradient */}
          <div
            className={cn(
              "absolute inset-0 rounded-3xl bg-gradient-to-b opacity-50",
              config.gradient
            )}
          />

          {/* Sparkle burst */}
          <AnimatePresence>
            {showConfetti && <SparkleBurst />}
          </AnimatePresence>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Badge Label */}
            <motion.span
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "text-sm font-bold uppercase tracking-wider mb-4",
                config.labelColor
              )}
            >
              Conquista {config.label}
            </motion.span>

            {/* Icon with ring animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1, duration: 0.6 }}
              className="relative mb-6"
            >
              {/* Pulse rings */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.5, 0.2, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full",
                  `bg-${achievement.rarity === "legendary" ? "coins" : "primary"}/20`
                )}
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1.6],
                  opacity: [0.5, 0.2, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className={cn(
                  "absolute inset-0 rounded-full",
                  `bg-${achievement.rarity === "legendary" ? "coins" : "primary"}/20`
                )}
              />

              <div
                className={cn(
                  "flex items-center justify-center w-24 h-24 rounded-full border-4",
                  `border-${achievement.rarity === "legendary" ? "coins" : achievement.rarity === "epic" ? "primary" : "info"}/50`,
                  config.gradient.replace("from-", "bg-gradient-to-br from-")
                )}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Icon className={cn("w-12 h-12", config.labelColor)} />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display font-bold text-2xl mb-2"
            >
              {achievement.name}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6 max-w-xs"
            >
              {achievement.description}
            </motion.p>

            {/* Rewards */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-6 mb-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3, delay: 0.6 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-xp/10 border border-xp/20"
              >
                <Zap className="w-5 h-5 text-xp" />
                <span className="text-lg font-bold text-xp">+{achievement.xpReward} XP</span>
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3, delay: 0.7 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-coins/10 border border-coins/20"
              >
                <Coins className="w-5 h-5 text-coins" />
                <span className="text-lg font-bold text-coins">+{achievement.coinsReward}</span>
              </motion.div>
            </motion.div>

            {/* Unlocked date */}
            {achievement.unlockedAt && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-muted-foreground"
              >
                Desbloqueado em {achievement.unlockedAt.toLocaleDateString("pt-BR")}
              </motion.p>
            )}

            {/* Close button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6"
            >
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary press-scale"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Incrível!
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

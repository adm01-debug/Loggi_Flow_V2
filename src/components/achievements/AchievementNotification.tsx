import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, X, Coins } from "lucide-react";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";

const rarityConfig = {
  common: {
    gradient: "from-muted to-muted-foreground/20",
    border: "border-muted-foreground/30",
    glow: "shadow-lg",
    label: "Comum",
  },
  rare: {
    gradient: "from-info/20 to-info/20",
    border: "border-info/50",
    glow: "shadow-lg shadow-info/20",
    label: "Raro",
  },
  epic: {
    gradient: "from-primary/20 to-primary/20",
    border: "border-primary/50",
    glow: "shadow-lg shadow-primary/30",
    label: "Épico",
  },
  legendary: {
    gradient: "from-xp/20 to-coins/20",
    border: "border-xp/50",
    glow: "shadow-lg shadow-xp/30",
    label: "Lendário",
  },
};

export function AchievementNotificationContainer() {
  const { notifications, dismissNotification } = useAchievementNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const config = rarityConfig[notification.rarity];
          
          return (
            <motion.div
              key={notification.timestamp}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto"
            >
              <div
                className={`relative overflow-hidden rounded-xl border ${config.border} bg-gradient-to-r ${config.gradient} backdrop-blur-lg ${config.glow}`}
              >
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-xp/60"
                      initial={{ 
                        x: Math.random() * 100 + "%", 
                        y: "100%",
                        opacity: 0 
                      }}
                      animate={{ 
                        y: "-20%",
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>

                <div className="relative p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                      >
                        <Trophy className="w-5 h-5 text-xp" />
                      </motion.div>
                      <span className="text-xs font-semibold text-xp uppercase tracking-wider">
                        Conquista Desbloqueada!
                      </span>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Achievement Info */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-12 h-12 rounded-lg bg-card/50 flex items-center justify-center text-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {notification.icon}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground truncate">
                        {notification.name}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                    </div>
                  </div>

                  {/* Rewards */}
                  <motion.div
                    className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-xp" />
                      <span className="text-sm font-semibold text-xp">
                        +{notification.xpReward} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-coins" />
                      <span className="text-sm font-semibold text-coins">
                        +{notification.coinsReward}
                      </span>
                    </div>
                    <div className="ml-auto">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        notification.rarity === "legendary" ? "bg-xp/20 text-xp" :
                        notification.rarity === "epic" ? "bg-purple-500/20 text-purple-400" :
                        notification.rarity === "rare" ? "bg-blue-500/20 text-blue-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {config.label}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Progress bar animation */}
                <motion.div
                  className="h-1 bg-xp/50"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

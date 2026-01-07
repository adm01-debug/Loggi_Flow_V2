import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfettiExplosion } from '@/components/ui/confetti';

interface AchievementToastPremiumProps {
  isVisible: boolean;
  achievement: {
    name: string;
    description: string;
    icon?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
    coinsReward?: number;
  };
  onClose: () => void;
  onViewAll?: () => void;
}

const rarityConfig = {
  common: {
    gradient: 'from-slate-500 to-slate-600',
    glow: 'shadow-slate-500/30',
    border: 'border-slate-400/50',
    label: 'Comum',
    labelColor: 'text-slate-400'
  },
  rare: {
    gradient: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/40',
    border: 'border-blue-400/50',
    label: 'Raro',
    labelColor: 'text-blue-400'
  },
  epic: {
    gradient: 'from-purple-500 to-purple-600',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-400/50',
    label: 'Épico',
    labelColor: 'text-purple-400'
  },
  legendary: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    glow: 'shadow-amber-500/60',
    border: 'border-amber-400/50',
    label: 'Lendário',
    labelColor: 'text-amber-400'
  }
};

export function AchievementToastPremium({
  isVisible,
  achievement,
  onClose,
  onViewAll
}: AchievementToastPremiumProps) {
  const config = rarityConfig[achievement.rarity];

  return (
    <>
      {/* Confetti for legendary achievements */}
      <ConfettiExplosion 
        isActive={isVisible && achievement.rarity === 'legendary'} 
        particleCount={100}
        duration={4000}
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25 
            }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className={cn(
              "relative overflow-hidden rounded-2xl bg-card border-2",
              "shadow-2xl",
              config.border,
              config.glow
            )}>
              {/* Animated background gradient */}
              <motion.div
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 opacity-10 bg-gradient-to-r",
                  config.gradient
                )}
                style={{ backgroundSize: '200% 200%' }}
              />

              {/* Sparkle effects */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 text-amber-400/20"
              >
                <Sparkles className="w-16 h-16" />
              </motion.div>

              <div className="relative p-4">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted/50 
                           transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Trophy className={cn("w-5 h-5", config.labelColor)} />
                  </motion.div>
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", config.labelColor)}>
                    Conquista Desbloqueada • {config.label}
                  </span>
                </div>

                {/* Content */}
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      delay: 0.2 
                    }}
                    className={cn(
                      "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center",
                      "shadow-lg",
                      config.gradient,
                      config.glow
                    )}
                  >
                    <span className="text-3xl">{achievement.icon || '🏆'}</span>
                  </motion.div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-foreground line-clamp-1">
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Rewards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-4 mt-4 pt-4 border-t border-border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-emerald-500">
                        +{achievement.xpReward}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">XP</span>
                    </div>
                  </div>

                  {achievement.coinsReward && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-lg">🪙</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-amber-500">
                          +{achievement.coinsReward}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">moedas</span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1" />

                  {onViewAll && (
                    <Button variant="ghost" size="sm" onClick={onViewAll}>
                      Ver Todas
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

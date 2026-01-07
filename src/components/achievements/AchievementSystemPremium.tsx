import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Zap, Medal, Crown, Target, 
  Flame, Award, Lock, CheckCircle2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConfettiExplosion } from '@/components/ui/confetti';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  coinsReward: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

const rarityConfig = {
  common: { 
    label: 'Comum', 
    color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    glow: 'shadow-slate-500/20'
  },
  rare: { 
    label: 'Raro', 
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    glow: 'shadow-blue-500/30'
  },
  epic: { 
    label: 'Épico', 
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    glow: 'shadow-purple-500/40'
  },
  legendary: { 
    label: 'Lendário', 
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    glow: 'shadow-yellow-500/50'
  }
};

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  medal: Medal,
  crown: Crown,
  target: Target,
  flame: Flame,
  award: Award
};

// Achievement Card
export function AchievementCard({ 
  achievement, 
  onClick,
  showProgress = true 
}: { 
  achievement: Achievement; 
  onClick?: () => void;
  showProgress?: boolean;
}) {
  const Icon = iconMap[achievement.icon] || Trophy;
  const config = rarityConfig[achievement.rarity];
  const progressPercent = (achievement.progress / achievement.maxProgress) * 100;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border cursor-pointer transition-all",
        achievement.unlocked 
          ? `${config.color} shadow-lg ${config.glow}` 
          : "bg-muted/30 border-muted"
      )}
    >
      {/* Locked overlay */}
      {!achievement.unlocked && (
        <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center z-10">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          achievement.unlocked ? config.color : "bg-muted"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            achievement.unlocked ? "" : "text-muted-foreground"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{achievement.name}</h4>
            <Badge variant="outline" className={cn("text-[10px]", config.color)}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {achievement.description}
          </p>

          {showProgress && !achievement.unlocked && (
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">
                {achievement.progress}/{achievement.maxProgress}
              </p>
            </div>
          )}

          {achievement.unlocked && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <Zap className="w-3 h-3" />
                +{achievement.xpReward} XP
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Medal className="w-3 h-3" />
                +{achievement.coinsReward} coins
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Unlocked checkmark */}
      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
      )}
    </motion.div>
  );
}

// Achievement unlock modal
export function AchievementUnlockModalPremium({
  achievement,
  isOpen,
  onClose
}: {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && achievement) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, achievement]);

  if (!achievement) return null;

  const Icon = iconMap[achievement.icon] || Trophy;
  const config = rarityConfig[achievement.rarity];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <ConfettiExplosion isActive={showConfetti} particleCount={100} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-card border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header with gradient */}
              <div className={cn(
                "p-8 text-center",
                "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
              )}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className={cn(
                    "w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                    config.color,
                    "shadow-xl",
                    config.glow
                  )}
                >
                  <Icon className="w-12 h-12" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Badge className={cn("mb-2", config.color)}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <h2 className="text-xl font-bold mb-1">{achievement.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                </motion.div>
              </div>

              {/* Rewards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 border-t"
              >
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Recompensas desbloqueadas:
                </p>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-yellow-600" />
                    </div>
                    <p className="font-bold text-lg">+{achievement.xpReward}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Medal className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="font-bold text-lg">+{achievement.coinsReward}</p>
                    <p className="text-xs text-muted-foreground">Coins</p>
                  </div>
                </div>
              </motion.div>

              {/* Footer */}
              <div className="p-4 border-t bg-muted/30">
                <Button onClick={onClose} className="w-full">
                  Incrível!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Achievement grid
export function AchievementGrid({
  achievements,
  onAchievementClick
}: {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}) {
  const categories = [...new Set(achievements.map(a => a.category))];
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progress = (unlockedCount / achievements.length) * 100;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-semibold">Conquistas</span>
          </div>
          <Badge variant="secondary">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Categories */}
      {categories.map(category => {
        const categoryAchievements = achievements.filter(a => a.category === category);
        return (
          <div key={category}>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              {category}
              <Badge variant="outline" className="ml-auto">
                {categoryAchievements.filter(a => a.unlocked).length}/{categoryAchievements.length}
              </Badge>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => onAchievementClick?.(achievement)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Level progress bar
export function LevelProgressBar({
  level,
  currentXP,
  requiredXP,
  showDetails = true
}: {
  level: number;
  currentXP: number;
  requiredXP: number;
  showDetails?: boolean;
}) {
  const progress = (currentXP / requiredXP) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold">
            {level}
          </div>
          <div>
            <p className="font-medium">Nível {level}</p>
            {showDetails && (
              <p className="text-xs text-muted-foreground">
                {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Crown className="w-3 h-3" />
          Nível {level + 1}
        </Badge>
      </div>
      <div className="relative">
        <Progress value={progress} className="h-3" />
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['0%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ width: '50%' }}
        />
      </div>
    </div>
  );
}

// Streak counter
export function StreakCounter({
  currentStreak,
  bestStreak,
  isActive = true
}: {
  currentStreak: number;
  bestStreak: number;
  isActive?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isActive 
        ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20" 
        : "bg-muted/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              isActive ? "bg-orange-500/20" : "bg-muted"
            )}
          >
            <Flame className={cn(
              "w-6 h-6",
              isActive ? "text-orange-500" : "text-muted-foreground"
            )} />
          </motion.div>
          <div>
            <p className="font-bold text-2xl">{currentStreak} dias</p>
            <p className="text-xs text-muted-foreground">Sequência atual</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{bestStreak} dias</p>
          <p className="text-xs text-muted-foreground">Melhor sequência</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Star, Sparkles, Trophy, Zap, Gift, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfettiExplosion } from "@/components/ui/confetti";

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  previousLevel?: number;
  rewards?: {
    xp?: number;
    coins?: number;
    title?: string;
    badges?: string[];
  };
}

const levelTitles: Record<number, string> = {
  1: "Novato Logístico",
  2: "Aprendiz de Rotas",
  3: "Despachante Jr.",
  4: "Coordenador de Entregas",
  5: "Especialista em Frete",
  10: "Mestre da Logística",
  15: "Comandante de Frotas",
  20: "Lenda do Transporte",
  25: "Titan da Logística",
  50: "Supremo Logístico",
};

const getLevelTitle = (level: number): string => {
  const keys = Object.keys(levelTitles).map(Number).sort((a, b) => b - a);
  for (const key of keys) {
    if (level >= key) return levelTitles[key];
  }
  return "Iniciante";
};

const getLevelColor = (level: number): string => {
  if (level >= 50) return "from-amber-400 via-yellow-500 to-orange-500"; // Legendary
  if (level >= 25) return "from-purple-400 via-pink-500 to-red-500"; // Epic
  if (level >= 15) return "from-cyan-400 via-blue-500 to-indigo-500"; // Rare
  if (level >= 10) return "from-emerald-400 via-green-500 to-teal-500"; // Uncommon
  return "from-orange-400 via-amber-500 to-yellow-500"; // Common
};

const Particle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full bg-primary"
    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0.5],
      x: x,
      y: y,
    }}
    transition={{
      duration: 1.5,
      delay: delay,
      ease: "easeOut",
    }}
  />
);

const FloatingIcon = ({ icon: Icon, delay, x, y }: { icon: React.ElementType; delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0.8],
      x: [0, x],
      y: [0, y],
      rotate: [0, 360],
    }}
    transition={{
      duration: 2,
      delay: delay,
      ease: "easeOut",
    }}
  >
    <Icon className="w-6 h-6 text-primary opacity-70" />
  </motion.div>
);

export function LevelUpCelebration({
  isOpen,
  onClose,
  newLevel,
  previousLevel = newLevel - 1,
  rewards,
}: LevelUpCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const levelTitle = getLevelTitle(newLevel);
  const levelColor = getLevelColor(newLevel);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowDetails(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowDetails(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  // Generate random particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200 - 50,
  }));

  const floatingIcons = [
    { icon: Star, delay: 0.2, x: -80, y: -60 },
    { icon: Sparkles, delay: 0.4, x: 80, y: -80 },
    { icon: Trophy, delay: 0.6, x: -100, y: 40 },
    { icon: Zap, delay: 0.3, x: 100, y: 20 },
    { icon: Crown, delay: 0.5, x: 0, y: -100 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden border-0 bg-gradient-to-b from-background via-background to-muted/30">
        {showConfetti && <ConfettiExplosion isActive={showConfetti} />}
        
        <div className="relative flex flex-col items-center py-6">
          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} />
            ))}
          </div>

          {/* Floating icons */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {floatingIcons.map((item, idx) => (
              <FloatingIcon key={idx} {...item} />
            ))}
          </div>

          {/* Level badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2 
            }}
            className="relative mb-6"
          >
            {/* Glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse",
              `bg-gradient-to-r ${levelColor}`
            )} />
            
            {/* Badge container */}
            <div className={cn(
              "relative w-32 h-32 rounded-full flex items-center justify-center",
              "bg-gradient-to-br shadow-2xl",
              levelColor
            )}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                className="text-center"
              >
                <Rocket className="w-10 h-10 text-white mx-auto mb-1" />
                <span className="text-4xl font-bold text-white drop-shadow-lg">
                  {newLevel}
                </span>
              </motion.div>
            </div>

            {/* Ring animation */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-4",
                "border-primary/50"
              )}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1,
                repeat: 3,
                repeatDelay: 0.3,
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-display font-bold mb-2">
              Nível {previousLevel} → {newLevel}
            </h2>
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className={cn(
                "text-lg font-medium bg-clip-text text-transparent",
                `bg-gradient-to-r ${levelColor}`
              )}
            >
              {levelTitle}
            </motion.p>
          </motion.div>

          {/* Rewards */}
          <AnimatePresence>
            {showDetails && rewards && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-3 mb-6"
              >
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Recompensas desbloqueadas
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {rewards.xp && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-xp/10 border border-xp/30 rounded-lg p-3 text-center"
                    >
                      <Zap className="w-5 h-5 text-xp mx-auto mb-1" />
                      <span className="text-lg font-bold text-xp">+{rewards.xp}</span>
                      <p className="text-xs text-muted-foreground">XP Bônus</p>
                    </motion.div>
                  )}
                  
                  {rewards.coins && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-coins/10 border border-coins/30 rounded-lg p-3 text-center"
                    >
                      <Gift className="w-5 h-5 text-coins mx-auto mb-1" />
                      <span className="text-lg font-bold text-coins">+{rewards.coins}</span>
                      <p className="text-xs text-muted-foreground">Moedas</p>
                    </motion.div>
                  )}
                </div>

                {rewards.badges && rewards.badges.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-muted/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {rewards.badges.join(", ")}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full"
          >
            <Button
              onClick={onClose}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Continuar
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para gerenciar celebração de level up
export function useLevelUpCelebration() {
  const [celebrationState, setCelebrationState] = useState<{
    isOpen: boolean;
    newLevel: number;
    previousLevel: number;
    rewards?: {
      xp?: number;
      coins?: number;
      title?: string;
      badges?: string[];
    };
  }>({
    isOpen: false,
    newLevel: 1,
    previousLevel: 0,
  });

  const celebrate = useCallback((
    newLevel: number,
    previousLevel: number,
    rewards?: {
      xp?: number;
      coins?: number;
      title?: string;
      badges?: string[];
    }
  ) => {
    setCelebrationState({
      isOpen: true,
      newLevel,
      previousLevel,
      rewards,
    });
  }, []);

  const close = useCallback(() => {
    setCelebrationState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...celebrationState,
    celebrate,
    close,
    LevelUpCelebration: () => (
      <LevelUpCelebration
        isOpen={celebrationState.isOpen}
        onClose={close}
        newLevel={celebrationState.newLevel}
        previousLevel={celebrationState.previousLevel}
        rewards={celebrationState.rewards}
      />
    ),
  };
}

export default LevelUpCelebration;

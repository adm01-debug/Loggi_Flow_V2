import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Package,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WelcomeModalProps {
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
}

const welcomeSteps = [
  {
    icon: Package,
    title: "Gerencie Entregas",
    description:
      "Rastreie todas suas entregas e coletas em tempo real com visibilidade completa.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Analytics Avançados",
    description:
      "Tome decisões baseadas em dados com dashboards e relatórios inteligentes.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Trophy,
    title: "Gamificação",
    description:
      "Motive sua equipe com XP, conquistas e um sistema de recompensas divertido.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Colaboração",
    description:
      "Trabalhe em equipe com comentários, menções e notificações em tempo real.",
    color: "from-purple-500 to-pink-500",
  },
];

export function WelcomeModal({
  userName,
  isOpen,
  onClose,
  onStartTour,
}: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  const handleNext = () => {
    if (!showFeatures) {
      setShowFeatures(true);
    } else if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      onStartTour?.();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card">
        <AnimatePresence mode="wait">
          {!showFeatures ? (
            // Welcome screen
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-8 text-center"
            >
              {/* Animated background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                  }}
                  animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
              </div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg shadow-primary/30"
              >
                <Rocket className="w-12 h-12 text-primary-foreground" />
              </motion.div>

              {/* Welcome text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-display font-bold mb-2">
                  Bem-vindo{userName ? `, ${userName.split(" ")[0]}` : ""}! 🎉
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Estamos felizes em ter você no LogiFlow
                </p>
              </motion.div>

              {/* Quick stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-6 mb-8"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">5 min</div>
                  <div className="text-xs text-muted-foreground">
                    Setup rápido
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    500 XP
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Para ganhar
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">6</div>
                  <div className="text-xs text-muted-foreground">
                    Conquistas
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-3"
              >
                <Button size="lg" onClick={handleNext} className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Conhecer o LogiFlow
                </Button>
                <Button variant="ghost" onClick={handleSkip}>
                  Pular introdução
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            // Feature carousel
            <motion.div
              key="features"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="relative"
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={handleSkip}
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Feature content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8"
                >
                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div
                      className={cn(
                        "w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                        welcomeSteps[currentStep].color,
                      )}
                    >
                      {(() => {
                        const Icon = welcomeSteps[currentStep].icon;
                        return <Icon className="w-10 h-10 text-white" />;
                      })()}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-display font-bold mb-2">
                      {welcomeSteps[currentStep].title}
                    </h3>
                    <p className="text-muted-foreground">
                      {welcomeSteps[currentStep].description}
                    </p>
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {welcomeSteps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === currentStep
                            ? "w-6 bg-primary"
                            : "bg-muted hover:bg-muted-foreground/50",
                        )}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleSkip}
                    >
                      Pular
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleNext}>
                      {currentStep === welcomeSteps.length - 1 ? (
                        <>
                          Começar
                          <Zap className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Próximo
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

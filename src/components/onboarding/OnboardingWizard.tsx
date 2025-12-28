import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Trophy, 
  User, Users, Truck, Package, LayoutDashboard, Bell,
  Check, Gift
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOnboarding, OnboardingStep } from '@/hooks/useOnboarding';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User, Users, Truck, Package, LayoutDashboard, Bell
};

interface StepCardProps {
  step: OnboardingStep;
  isCompleted: boolean;
  isCurrent: boolean;
  onComplete: () => void;
  onNavigate: () => void;
}

function StepCard({ step, isCompleted, isCurrent, onComplete, onNavigate }: StepCardProps) {
  const Icon = iconMap[step.icon] || Package;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group",
        isCompleted 
          ? "border-primary/50 bg-primary/5" 
          : isCurrent 
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
            : "border-border hover:border-primary/30 hover:bg-muted/50"
      )}
      onClick={onNavigate}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isCompleted 
            ? "bg-primary text-primary-foreground" 
            : isCurrent 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {isCompleted ? (
            <Check className="w-6 h-6" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-semibold",
              isCompleted && "text-muted-foreground line-through"
            )}>
              {step.title}
            </h4>
            <Badge variant="secondary" className="text-xs">
              +{step.xpReward} XP
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {step.description}
          </p>
        </div>

        {!isCompleted && (
          <Button
            size="sm"
            variant={isCurrent ? "default" : "ghost"}
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="shrink-0"
          >
            {isCurrent ? "Completar" : "Pular"}
          </Button>
        )}
      </div>

      {isCurrent && !isCompleted && (
        <motion.div
          className="absolute -inset-px rounded-xl border-2 border-primary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const {
    steps,
    completedSteps,
    isCompleted,
    progressPercentage,
    isStepCompleted,
    completeStep,
    showWizard,
    dismissWizard,
    totalXpEarned
  } = useOnboarding();
  
  const [currentView, setCurrentView] = useState<'welcome' | 'steps' | 'complete'>('welcome');

  const handleStepNavigate = (step: OnboardingStep) => {
    if (step.route) {
      navigate(step.route);
      dismissWizard();
    }
  };

  const handleComplete = (stepId: string) => {
    completeStep(stepId);
  };

  const currentStepIndex = steps.findIndex(s => !isStepCompleted(s.id));

  if (isCompleted && currentView !== 'complete') {
    setCurrentView('complete');
  }

  return (
    <Dialog open={showWizard} onOpenChange={(open) => !open && dismissWizard()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center"
                >
                  <Sparkles className="w-12 h-12 text-primary-foreground" />
                </motion.div>

                <div>
                  <h2 className="text-3xl font-bold">Bem-vindo ao Loggi-Flow! 🎉</h2>
                  <p className="text-muted-foreground mt-2 text-lg">
                    Vamos configurar sua conta em poucos passos e ganhar XP!
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{steps.length}</div>
                    <div className="text-sm text-muted-foreground">Passos</div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-500">
                      {steps.reduce((acc, s) => acc + s.xpReward, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">XP Total</div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">~5min</div>
                    <div className="text-sm text-muted-foreground">Tempo</div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={dismissWizard}>
                    Fazer depois
                  </Button>
                  <Button onClick={() => setCurrentView('steps')} className="gap-2">
                    Começar <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'steps' && (
            <motion.div
              key="steps"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Configuração Inicial</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedSteps.length} de {steps.length} passos completados
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={dismissWizard}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {steps.map((step, index) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    isCompleted={isStepCompleted(step.id)}
                    isCurrent={index === currentStepIndex}
                    onComplete={() => handleComplete(step.id)}
                    onNavigate={() => handleStepNavigate(step)}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setCurrentView('welcome')}>
                  <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gift className="w-4 h-4 text-primary" />
                  <span>XP ganho: <strong className="text-foreground">{totalXpEarned}</strong></span>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold mb-2">Parabéns! 🎊</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Você completou o onboarding e está pronto para usar o Loggi-Flow!
              </p>

              <div className="bg-muted/50 rounded-xl p-6 mb-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  +{totalXpEarned} XP
                </div>
                <p className="text-sm text-muted-foreground">
                  Total de experiência conquistada
                </p>
              </div>

              <Button onClick={dismissWizard} size="lg" className="gap-2">
                Começar a usar <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

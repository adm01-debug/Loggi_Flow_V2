import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, CheckCircle2, ChevronRight, ChevronLeft,
  Sparkles, Star, Trophy, Zap, ArrowRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  optional?: boolean;
  xpReward?: number;
}

interface OnboardingWizardPremiumProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export function OnboardingWizardPremium({
  steps,
  onComplete,
  onSkip,
  currentStep: controlledStep,
  onStepChange
}: OnboardingWizardPremiumProps) {
  const [internalStep, setInternalStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const currentStep = controlledStep ?? internalStep;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const totalXP = steps.reduce((acc, s) => acc + (s.xpReward || 0), 0);
  const earnedXP = Array.from(completedSteps).reduce((acc, id) => {
    const s = steps.find(st => st.id === id);
    return acc + (s?.xpReward || 0);
  }, 0);

  const goToStep = useCallback((index: number) => {
    if (onStepChange) {
      onStepChange(index);
    } else {
      setInternalStep(index);
    }
  }, [onStepChange]);

  const handleNext = async () => {
    if (step.action) {
      setIsLoading(true);
      try {
        await step.action.onClick();
      } finally {
        setIsLoading(false);
      }
    }

    setCompletedSteps(prev => new Set(prev).add(step.id));

    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl bg-card border rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Zap className="w-3 h-3" />
            {earnedXP}/{totalXP} XP
          </Badge>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Configuração Inicial</h2>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => index <= currentStep && goToStep(index)}
                disabled={index > currentStep}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  index < currentStep && "bg-primary text-primary-foreground",
                  index === currentStep && "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2",
                  index > currentStep && "bg-muted text-muted-foreground",
                  completedSteps.has(s.id) && index < currentStep && "bg-green-500 text-white"
                )}
              >
                {completedSteps.has(s.id) ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  {step.optional && (
                    <Badge variant="outline" className="text-xs">Opcional</Badge>
                  )}
                  {step.xpReward && (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      +{step.xpReward} XP
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-6">
              {step.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {step.optional && (
            <Button variant="ghost" onClick={handleSkipStep}>
              Pular
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="gap-2 min-w-[120px]"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
            ) : currentStep === steps.length - 1 ? (
              <>
                Concluir
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                {step.action?.label || 'Próximo'}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Celebration screen for completion
export function OnboardingComplete({
  xpEarned,
  onContinue
}: {
  xpEarned: number;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md text-center p-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center"
      >
        <Trophy className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold mb-2"
      >
        Parabéns! 🎉
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground mb-6"
      >
        Você completou a configuração inicial do sistema!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-600 rounded-full mb-8"
      >
        <Zap className="w-5 h-5" />
        <span className="font-bold text-lg">+{xpEarned} XP</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button onClick={onContinue} size="lg" className="gap-2">
          Começar a usar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Feature tour tooltip
export function FeatureTourTooltip({
  title,
  description,
  step,
  totalSteps,
  position = 'bottom',
  onNext,
  onPrevious,
  onSkip,
  onComplete
}: {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}) {
  const isLast = step === totalSteps;
  const isFirst = step === 1;

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "absolute z-50 w-72 p-4 bg-popover border rounded-xl shadow-xl",
        positionClasses[position]
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            {step} de {totalSteps}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onSkip} className="h-6 w-6 p-0">
          <X className="w-3 h-3" />
        </Button>
      </div>

      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={isFirst}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i + 1 === step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <Button
          size="sm"
          onClick={isLast ? onComplete : onNext}
          className="gap-1"
        >
          {isLast ? 'Concluir' : 'Próximo'}
          {!isLast && <ChevronRight className="w-3 h-3" />}
        </Button>
      </div>
    </motion.div>
  );
}

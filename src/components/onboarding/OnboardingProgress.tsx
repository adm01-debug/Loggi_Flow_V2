import { motion } from 'framer-motion';
import { Rocket, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingProgressProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function OnboardingProgress({ variant = 'compact', className }: OnboardingProgressProps) {
  const {
    steps,
    completedSteps,
    progressPercentage,
    isCompleted,
    openWizard,
    isLoading
  } = useOnboarding();

  if (isLoading || isCompleted) return null;

  const nextStep = steps.find(s => !completedSteps.includes(s.id));

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors",
          className
        )}
        onClick={openWizard}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {nextStep?.title || 'Configuração'}
            </span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {completedSteps.length}/{steps.length}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-1.5 mt-1" />
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Rocket className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Complete sua configuração</h4>
            <Badge variant="secondary">
              {completedSteps.length}/{steps.length} passos
            </Badge>
          </div>

          <Progress value={progressPercentage} className="h-2 mb-3" />

          <div className="flex flex-wrap gap-2 mb-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                  completedSteps.includes(step.id)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {completedSteps.includes(step.id) && (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                <span>{step.title}</span>
              </div>
            ))}
          </div>

          <Button size="sm" onClick={openWizard} className="gap-2">
            Continuar configuração
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

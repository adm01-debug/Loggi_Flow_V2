import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Circle, ChevronDown, ChevronUp, Rocket, 
  Gift, Star, X, Sparkles, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';

export function OnboardingChecklist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();
  
  const {
    steps,
    completedSteps,
    progressPercentage,
    isCompleted,
    completeStep,
    isStepCompleted,
    isLoading
  } = useOnboarding();

  if (isLoading || isCompleted) return null;

  const handleStepClick = (stepId: string, route?: string) => {
    if (route) {
      navigate(route);
    }
  };

  const remainingSteps = steps.filter(s => !isStepCompleted(s.id));
  const totalXP = steps.reduce((acc, s) => acc + s.xpReward, 0);
  const earnedXP = steps
    .filter(s => isStepCompleted(s.id))
    .reduce((acc, s) => acc + s.xpReward, 0);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 relative"
        >
          <Rocket className="h-6 w-6" />
          {remainingSteps.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {remainingSteps.length}
            </span>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className="fixed bottom-4 right-4 z-50 w-80"
    >
      <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div 
          className="p-4 bg-gradient-to-r from-primary/10 to-transparent cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Configuração Inicial</h4>
                <p className="text-xs text-muted-foreground">
                  {completedSteps.length}/{steps.length} passos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
              >
                <X className="h-4 w-4" />
              </Button>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          {/* XP Reward preview */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Gift className="w-3 h-3" />
              <span>{earnedXP}/{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Star className="w-3 h-3" />
              <span>{remainingSteps.length} restantes</span>
            </div>
          </div>
        </div>

        {/* Steps list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {steps.map((step, index) => {
                  const completed = isStepCompleted(step.id);
                  const isCurrent = !completed && completedSteps.length === index;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer group",
                        completed 
                          ? "bg-primary/5" 
                          : isCurrent
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50"
                      )}
                      onClick={() => handleStepClick(step.id, step.route)}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        completed
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      )}>
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          completed && "text-muted-foreground line-through"
                        )}>
                          {step.title}
                        </p>
                      </div>

                      {/* XP Badge */}
                      {!completed && (
                        <span className="text-xs font-medium text-primary shrink-0">
                          +{step.xpReward}
                        </span>
                      )}

                      {/* Arrow for current */}
                      {isCurrent && (
                        <ArrowRight className="w-4 h-4 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              {remainingSteps.length > 0 && (
                <div className="p-3 border-t border-border">
                  <Button 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => {
                      const nextStep = remainingSteps[0];
                      if (nextStep?.route) navigate(nextStep.route);
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Continuar: {remainingSteps[0]?.title}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Trophy, 
  User, Users, Truck, Package, LayoutDashboard, Bell,
  Check, Gift, Target, Rocket, Award
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
      layout
      className={cn(
        "relative p-5 rounded-2xl border-2 transition-all duration-500 cursor-pointer group overflow-hidden",
        isCompleted 
          ? "border-success/20 bg-success/5 opacity-70" 
          : isCurrent 
            ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10" 
            : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
      )}
      onClick={onNavigate}
    >
      <div className="flex items-start gap-4 relative z-10">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
          isCompleted 
            ? "bg-success text-success-foreground" 
            : isCurrent 
              ? "bg-primary text-primary-foreground scale-110 rotate-3 shadow-lg shadow-primary/30" 
              : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
        )}>
          {isCompleted ? (
            <Check className="w-7 h-7" />
          ) : (
            <Icon className="w-7 h-7" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-black text-base tracking-tight leading-tight",
              isCompleted && "text-muted-foreground line-through opacity-50"
            )}>
              {step.title}
            </h4>
            <Badge variant={isCompleted ? "outline" : "secondary"} className={cn(
              "text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
              !isCompleted && "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}>
              +{step.xpReward} XP
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {step.description}
          </p>
        </div>

        {!isCompleted && (
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant={isCurrent ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className={cn(
                "shrink-0 font-black text-[10px] uppercase tracking-widest h-8 rounded-xl",
                isCurrent && "shadow-lg shadow-primary/25"
              )}
            >
              {isCurrent ? "Pronto" : "Pular"}
            </Button>
          </div>
        )}
      </div>

      {isCurrent && !isCompleted && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 rounded-3xl border-none shadow-2xl">
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative p-12 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />

              <div className="relative z-10 text-center space-y-8">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                  className="relative w-32 h-32 mx-auto"
                >
                  <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse" />
                  <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6">
                    <Rocket className="w-16 h-16 text-primary-foreground" />
                  </div>
                </motion.div>

                <div>
                  <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                    LogiFlow <span className="text-primary underline decoration-primary/30">Alpha</span>
                  </h2>
                  <p className="text-muted-foreground mt-4 text-xl font-medium max-w-md mx-auto leading-relaxed">
                    Bem-vindo à nova era da logística inteligente. Vamos configurar seu workspace?
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto py-4">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <div className="text-3xl font-black text-primary">{steps.length}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Módulos</div>
                  </div>
                  <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                    <div className="text-3xl font-black text-amber-500">
                      {steps.reduce((acc, s) => acc + s.xpReward, 0)}
                    </div>
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">XP Bonus</div>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <div className="text-3xl font-black text-primary">~5min</div>
                    <div className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mt-1">Setup</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button variant="ghost" onClick={dismissWizard} className="font-black text-xs uppercase tracking-widest h-12 px-8 hover:bg-muted/50">
                    Fazer depois
                  </Button>
                  <Button onClick={() => setCurrentView('steps')} className="font-black text-xs uppercase tracking-widest h-12 px-10 gap-3 shadow-xl shadow-primary/25 rounded-2xl">
                    Iniciar Workshop <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'steps' && (
            <motion.div
              key="steps"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col h-[650px]"
            >
              <div className="p-8 border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight leading-none">Status do Setup</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
                        {completedSteps.length} de {steps.length} objetivos alcançados
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={dismissWizard} className="rounded-xl hover:bg-destructive/5 hover:text-destructive">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Sincronização</span>
                    <span className="text-xs font-black tabular-nums">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-glow rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background">
                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
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
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-6 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setCurrentView('welcome')} className="font-black text-[10px] uppercase tracking-widest h-10 px-6">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <div className="flex items-center gap-4 px-6 py-2 bg-background/50 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XP Total Acumulado</span>
                  </div>
                  <span className="text-xl font-black text-amber-500 tabular-nums">+{totalXpEarned}</span>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative p-12 text-center overflow-hidden bg-gradient-to-br from-success/5 via-background to-background"
            >
              {/* Confetti-like decoration */}
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" />
              <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-amber-400 rounded-full animate-bounce delay-100" />
              <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-success rounded-full animate-ping delay-500" />

              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
                className="relative w-40 h-40 mx-auto mb-10"
              >
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40">
                  <Trophy className="w-20 h-20 text-white" />
                </div>
              </motion.div>

              <div className="space-y-4 mb-10">
                <h2 className="text-4xl font-black tracking-tight text-foreground">Acesso Liberado! 🏁</h2>
                <p className="text-muted-foreground text-xl font-medium max-w-md mx-auto leading-relaxed">
                  Workspace configurado com sucesso. Você agora tem acesso total às ferramentas LogiFlow.
                </p>
              </div>

              <div className="bg-primary/5 rounded-3xl p-8 mb-10 border-2 border-primary/10 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <div className="text-6xl font-black text-primary mb-3 tracking-tighter tabular-nums">
                  +{totalXpEarned} XP
                </div>
                <p className="text-xs font-black text-primary/70 uppercase tracking-widest">
                  Bonus de Primeira Sincronização
                </p>
              </div>

              <Button onClick={dismissWizard} size="lg" className="font-black text-xs uppercase tracking-widest h-14 px-12 gap-3 shadow-2xl shadow-primary/30 rounded-2xl animate-bounce-slow">
                Ir para o Painel <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

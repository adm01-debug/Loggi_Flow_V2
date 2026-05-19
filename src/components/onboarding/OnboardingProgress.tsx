import { motion } from 'framer-motion';
import { Rocket, ChevronRight, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks';

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-4 px-4 py-2.5 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group",
          className
        )}
        onClick={openWizard}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
          <div className="relative w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-6 transition-transform">
            <Rocket className="w-5 h-5" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-primary truncate">
              {nextStep?.title || 'Setup Workspace'}
            </span>
            <span className="text-[10px] font-black tabular-nums bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 rounded-full bg-primary/10" />
        </div>

        <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
          <ChevronRight className="w-4 h-4 text-primary" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-6 bg-gradient-to-br from-primary/5 via-background to-transparent border-2 border-primary/10 rounded-3xl overflow-hidden group",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Sparkles className="w-24 h-24 text-primary" />
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform duration-500">
            <Target className="w-8 h-8" />
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-xl font-black tracking-tight text-foreground">Acelere seu Setup</h4>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Complete os módulos para desbloquear o ranking e ganhar recompensas.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
              <span className="text-xs font-black text-primary uppercase tracking-widest">
                {completedSteps.length} / {steps.length} Objetivos
              </span>
            </div>
          </div>

          <div className="relative h-3 w-full bg-muted/50 rounded-full overflow-hidden mb-6">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-glow"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
            {steps.map((step) => {
              const completed = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    completed
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted/50 text-muted-foreground border-border/50"
                  )}
                >
                  {completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current opacity-30" />
                  )}
                  <span>{step.title}</span>
                </div>
              );
            })}
          </div>

          <Button 
            onClick={openWizard} 
            className="font-black text-xs uppercase tracking-widest px-8 h-12 rounded-2xl shadow-xl shadow-primary/25 gap-3"
          >
            Configurar Módulo Seguinte
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

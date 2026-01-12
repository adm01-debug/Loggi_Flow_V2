/**
 * Componente de Progresso Multi-Step Premium
 * 
 * @module components/common/StepProgressPremium
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ============================================
// Types
// ============================================

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  optional?: boolean;
}

type StepStatus = 'completed' | 'current' | 'upcoming' | 'error' | 'loading';

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  variant?: 'default' | 'compact' | 'vertical' | 'dots' | 'numbered';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  allowNavigation?: boolean;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  completedSteps?: number[];
  errorSteps?: number[];
  loadingStep?: number;
}

// ============================================
// Step Status Helper
// ============================================

function getStepStatus(
  index: number, 
  currentStep: number, 
  completedSteps?: number[], 
  errorSteps?: number[],
  loadingStep?: number
): StepStatus {
  if (loadingStep === index) return 'loading';
  if (errorSteps?.includes(index)) return 'error';
  if (completedSteps?.includes(index) || index < currentStep) return 'completed';
  if (index === currentStep) return 'current';
  return 'upcoming';
}

// ============================================
// Step Icon Component
// ============================================

function StepIcon({ 
  step, 
  index, 
  status, 
  size 
}: { 
  step: Step; 
  index: number; 
  status: StepStatus;
  size: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const statusClasses = {
    completed: 'bg-success text-success-foreground',
    current: 'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
    upcoming: 'bg-muted text-muted-foreground',
    error: 'bg-destructive text-destructive-foreground',
    loading: 'bg-primary/50 text-primary-foreground',
  };

  const StepIconComponent = step.icon;

  return (
    <motion.div
      className={cn(
        'rounded-full flex items-center justify-center font-medium transition-all duration-300',
        sizeClasses[size],
        statusClasses[status]
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={status !== 'upcoming' ? { scale: 1.1 } : undefined}
    >
      <AnimatePresence mode="wait">
        {status === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
          </motion.div>
        ) : status === 'completed' ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <Check className={iconSizes[size]} strokeWidth={3} />
          </motion.div>
        ) : StepIconComponent ? (
          <StepIconComponent className={iconSizes[size]} />
        ) : (
          <span>{index + 1}</span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Default Horizontal Variant
// ============================================

function HorizontalSteps({
  steps,
  currentStep,
  size = 'md',
  showLabels = true,
  allowNavigation = false,
  onStepClick,
  completedSteps,
  errorSteps,
  loadingStep,
}: StepProgressProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const status = getStepStatus(index, currentStep, completedSteps, errorSteps, loadingStep);
        const isClickable = allowNavigation && status === 'completed';

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <motion.div
              className={cn(
                'flex flex-col items-center gap-2',
                isClickable && 'cursor-pointer'
              )}
              onClick={() => isClickable && onStepClick?.(index)}
              whileHover={isClickable ? { scale: 1.02 } : undefined}
              whileTap={isClickable ? { scale: 0.98 } : undefined}
            >
              <StepIcon step={step} index={index} status={status} size={size} />
              
              {showLabels && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className={cn(
                    'font-medium text-xs md:text-sm',
                    status === 'current' && 'text-primary',
                    status === 'completed' && 'text-success',
                    status === 'upcoming' && 'text-muted-foreground',
                    status === 'error' && 'text-destructive'
                  )}>
                    {step.title}
                  </p>
                  {step.description && size !== 'sm' && (
                    <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
                      {step.description}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 md:mx-4">
                <div className="h-0.5 bg-muted relative overflow-hidden rounded-full">
                  <motion.div
                    className={cn(
                      'absolute top-0 left-0 h-full rounded-full',
                      status === 'completed' ? 'bg-success' : 
                      status === 'current' ? 'bg-primary' : 'bg-transparent'
                    )}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: status === 'completed' ? '100%' : 
                             status === 'current' ? '50%' : '0%' 
                    }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Compact Variant
// ============================================

function CompactSteps({
  steps,
  currentStep,
  completedSteps,
  errorSteps,
  loadingStep,
  className,
}: StepProgressProps) {
  const current = steps[currentStep];
  const status = getStepStatus(currentStep, currentStep, completedSteps, errorSteps, loadingStep);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1">
        {steps.map((_, index) => {
          const stepStatus = getStepStatus(index, currentStep, completedSteps, errorSteps, loadingStep);
          return (
            <motion.div
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentStep ? 'w-6' : 'w-1.5',
                stepStatus === 'completed' && 'bg-success',
                stepStatus === 'current' && 'bg-primary',
                stepStatus === 'upcoming' && 'bg-muted',
                stepStatus === 'error' && 'bg-destructive'
              )}
              layoutId={`step-${index}`}
            />
          );
        })}
      </div>
      <span className="text-sm text-muted-foreground">
        {currentStep + 1}/{steps.length}
      </span>
      <span className="text-sm font-medium">{current?.title}</span>
    </div>
  );
}

// ============================================
// Vertical Variant
// ============================================

function VerticalSteps({
  steps,
  currentStep,
  size = 'md',
  allowNavigation = false,
  onStepClick,
  completedSteps,
  errorSteps,
  loadingStep,
  className,
}: StepProgressProps) {
  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(index, currentStep, completedSteps, errorSteps, loadingStep);
        const isClickable = allowNavigation && status === 'completed';

        return (
          <div key={step.id} className="flex gap-4">
            {/* Icon and Line Container */}
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(isClickable && 'cursor-pointer')}
                onClick={() => isClickable && onStepClick?.(index)}
                whileHover={isClickable ? { scale: 1.1 } : undefined}
              >
                <StepIcon step={step} index={index} status={status} size={size} />
              </motion.div>
              
              {/* Vertical Line */}
              {index < steps.length - 1 && (
                <div className="w-0.5 flex-1 min-h-8 bg-muted relative">
                  <motion.div
                    className={cn(
                      'absolute top-0 left-0 w-full',
                      status === 'completed' ? 'bg-success' : 'bg-transparent'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: status === 'completed' ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="pb-8 flex-1">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <p className={cn(
                  'font-medium',
                  status === 'current' && 'text-primary',
                  status === 'completed' && 'text-foreground',
                  status === 'upcoming' && 'text-muted-foreground',
                  status === 'error' && 'text-destructive'
                )}>
                  {step.title}
                  {step.optional && (
                    <span className="text-xs text-muted-foreground ml-2">(Opcional)</span>
                  )}
                </p>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Dots Variant
// ============================================

function DotsSteps({
  steps,
  currentStep,
  completedSteps,
  errorSteps,
  className,
}: StepProgressProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(index, currentStep, completedSteps, errorSteps);
        
        return (
          <motion.div
            key={step.id}
            className={cn(
              'rounded-full transition-all duration-300',
              index === currentStep ? 'w-6 h-2' : 'w-2 h-2',
              status === 'completed' && 'bg-success',
              status === 'current' && 'bg-primary',
              status === 'upcoming' && 'bg-muted',
              status === 'error' && 'bg-destructive'
            )}
            layoutId={`dot-${index}`}
            animate={{
              scale: index === currentStep ? 1 : 0.8,
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// Numbered Progress Bar
// ============================================

function NumberedSteps({
  steps,
  currentStep,
  className,
}: StepProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          Passo {currentStep + 1} de {steps.length}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-sm font-medium text-primary">
        {steps[currentStep]?.title}
      </p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function StepProgressPremium(props: StepProgressProps) {
  const { variant = 'default', className, ...rest } = props;

  const variants = {
    default: HorizontalSteps,
    compact: CompactSteps,
    vertical: VerticalSteps,
    dots: DotsSteps,
    numbered: NumberedSteps,
  };

  const Component = variants[variant];

  return (
    <div className={className}>
      <Component {...props} />
    </div>
  );
}

export default StepProgressPremium;

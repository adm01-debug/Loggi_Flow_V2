import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  variant?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  onStepClick?: (stepIndex: number) => void;
}

const sizeConfig = {
  sm: {
    circle: "w-6 h-6",
    icon: "w-3 h-3",
    text: "text-xs",
    line: "h-0.5",
    lineVertical: "w-0.5",
    gap: "gap-2",
  },
  md: {
    circle: "w-8 h-8",
    icon: "w-4 h-4",
    text: "text-sm",
    line: "h-0.5",
    lineVertical: "w-0.5",
    gap: "gap-3",
  },
  lg: {
    circle: "w-10 h-10",
    icon: "w-5 h-5",
    text: "text-base",
    line: "h-1",
    lineVertical: "w-1",
    gap: "gap-4",
  },
};

export function StepProgress({
  steps,
  currentStep,
  className,
  variant = "horizontal",
  size = "md",
  onStepClick,
}: StepProgressProps) {
  const config = sizeConfig[size];
  const isHorizontal = variant === "horizontal";

  return (
    <div
      className={cn(
        "flex",
        isHorizontal ? "flex-row items-center" : "flex-col",
        className
      )}
      role="navigation"
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = !!onStepClick && index <= currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex",
              isHorizontal ? "flex-1 items-center" : "items-start",
              config.gap
            )}
          >
            {/* Step indicator */}
            <div className={cn("flex items-center", isHorizontal ? "" : "flex-col")}>
              <motion.button
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  "relative rounded-full flex items-center justify-center font-medium transition-all duration-300",
                  config.circle,
                  (() => {
                    if (isCompleted) return "bg-primary text-primary-foreground shadow-md shadow-primary/30";
                    if (isCurrent) return "bg-primary/20 text-primary border-2 border-primary";
                    return "bg-muted text-muted-foreground border-2 border-border";
                  })(),
                  isClickable && "cursor-pointer hover:scale-110",
                  !isClickable && "cursor-default"
                )}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                whileHover={isClickable ? { scale: 1.15 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.title} - ${isCompleted ? "Concluído" : isCurrent ? "Atual" : "Pendente"}`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className={config.icon} />
                  </motion.div>
                ) : (
                  <span className={config.text}>{index + 1}</span>
                )}

                {/* Pulse animation for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* Step text (vertical) */}
              {!isHorizontal && (
                <div className="ml-4 pb-8">
                  <p className={cn("font-medium", config.text, isCurrent && "text-primary")}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className={cn("text-muted-foreground mt-1", config.text)}>
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 relative",
                  isHorizontal ? "mx-2" : "ml-4 h-full"
                )}
              >
                <div
                  className={cn(
                    "bg-border rounded-full",
                    isHorizontal ? `${config.line} w-full` : `${config.lineVertical} h-8`
                  )}
                />
                <motion.div
                  className={cn(
                    "absolute top-0 left-0 bg-primary rounded-full",
                    isHorizontal ? config.line : config.lineVertical
                  )}
                  initial={{ width: 0, height: 0 }}
                  animate={{
                    width: isHorizontal ? (isCompleted ? "100%" : "0%") : config.lineVertical,
                    height: !isHorizontal ? (isCompleted ? "100%" : "0%") : config.line,
                  }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              </div>
            )}

            {/* Step text (horizontal) */}
            {isHorizontal && (
              <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 text-center w-24">
                <p className={cn("font-medium truncate", config.text, isCurrent && "text-primary")}>
                  {step.title}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple linear progress with percentage
interface LinearProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  animated?: boolean;
  className?: string;
}

const variantColors = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export function LinearProgress({
  value,
  max = 100,
  label,
  showValue = true,
  size = "md",
  variant = "default",
  animated = true,
  className,
}: LinearProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const heightClass = size === "sm" ? "h-1.5" : size === "md" ? "h-2.5" : "h-4";

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-muted-foreground">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", heightClass)}>
        <motion.div
          className={cn(
            "h-full rounded-full relative overflow-hidden",
            variantColors[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1 relative">
                {/* Step Circle */}
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted || isActive ? "hsl(var(--primary))" : "hsl(var(--muted))",
                    scale: isActive ? 1.1 : 1,
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center z-10 text-white font-bold text-sm transition-colors",
                    !isCompleted && !isActive && "text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </motion.div>

                {/* Step Label */}
                <div className="mt-3 text-center px-2">
                  <p
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground hidden sm:block mt-0.5 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className="absolute top-4 left-[50%] w-full h-[2px] bg-muted -z-0">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

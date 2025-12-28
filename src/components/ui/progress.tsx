import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva("relative w-full overflow-hidden rounded-full", {
  variants: {
    variant: {
      default: "bg-secondary",
      muted: "bg-muted/50",
      ghost: "bg-transparent border border-border",
    },
    size: {
      default: "h-3",
      sm: "h-1.5",
      md: "h-2",
      lg: "h-4",
      xl: "h-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const indicatorVariants = cva("h-full transition-all duration-500 ease-out rounded-full relative overflow-hidden", {
  variants: {
    color: {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-destructive",
      info: "bg-info",
      gradient: "bg-gradient-to-r from-primary to-primary-glow",
      "gradient-success": "bg-gradient-to-r from-success to-emerald-400",
      "gradient-xp": "bg-gradient-to-r from-xp to-primary",
      "gradient-gold": "bg-gradient-to-r from-rank-gold to-yellow-400",
    },
    animation: {
      none: "",
      shimmer: "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:animate-shimmer",
      pulse: "animate-pulse",
      glow: "shadow-[0_0_10px_currentColor]",
    },
  },
  defaultVariants: {
    color: "default",
    animation: "none",
  },
});

interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, "color">,
    VariantProps<typeof progressVariants> {
  color?: "default" | "success" | "warning" | "danger" | "info" | "gradient" | "gradient-success" | "gradient-xp" | "gradient-gold";
  animation?: "none" | "shimmer" | "pulse" | "glow";
  showValue?: boolean;
  label?: string;
  valueLabel?: string;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, variant, size, color = "default", animation = "none", showValue, label, valueLabel, ...props }, ref) => (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold text-muted-foreground">
              {valueLabel || `${Math.round(value || 0)}%`}
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ variant, size }), className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(indicatorVariants({ color, animation }))}
          style={{ width: `${value || 0}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

// ============================================
// CIRCULAR PROGRESS
// ============================================

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: "default" | "success" | "warning" | "danger" | "info" | "xp";
  showValue?: boolean;
  label?: string;
  className?: string;
}

function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  progressColor = "default",
  showValue = true,
  label,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colors = {
    default: "stroke-primary",
    success: "stroke-success",
    warning: "stroke-warning",
    danger: "stroke-destructive",
    info: "stroke-info",
    xp: "stroke-xp",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-500 ease-out", colors[progressColor])}
        />
      </svg>
      {showValue && (
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-bold">{Math.round(value)}%</span>
          {label && <span className="text-[10px] text-muted-foreground uppercase">{label}</span>}
        </div>
      )}
    </div>
  );
}

export { Progress, CircularProgress };
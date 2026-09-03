import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline: "border-2 border-border text-foreground hover:bg-muted",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/90 shadow-sm",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/90 shadow-sm",
        ghost:
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        // Premium variants
        gradient:
          "border-transparent bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md",
        "gradient-success":
          "border-transparent bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-md",
        "gradient-warning":
          "border-transparent bg-gradient-to-r from-warning to-warning/80 text-warning-foreground shadow-md",
        "gradient-danger":
          "border-transparent bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-md",
        // Soft variants
        "soft-primary": "border-primary/20 bg-primary/10 text-primary",
        "soft-success": "border-success/20 bg-success/10 text-success",
        "soft-warning": "border-warning/20 bg-warning/10 text-warning",
        "soft-danger":
          "border-destructive/20 bg-destructive/10 text-destructive",
        "soft-info": "border-info/20 bg-info/10 text-info",
        // Glow variants
        "glow-primary":
          "border-transparent bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]",
        "glow-success":
          "border-transparent bg-success text-success-foreground shadow-[0_0_15px_hsl(var(--success)/0.5)]",
        "glow-warning":
          "border-transparent bg-warning text-warning-foreground shadow-[0_0_15px_hsl(var(--warning)/0.5)]",
        // Status variants
        pending: "border-warning/30 bg-warning/10 text-warning animate-pulse",
        active: "border-success/30 bg-success/10 text-success",
        inactive: "border-muted bg-muted text-muted-foreground",
        // Gamification
        xp: "border-transparent bg-gradient-to-r from-xp to-primary text-xp-foreground shadow-md",
        coins:
          "border-transparent bg-gradient-to-r from-coins to-warning text-coins-foreground shadow-md",
        streak:
          "border-transparent bg-gradient-to-r from-streak to-primary text-streak-foreground shadow-md",
        // Rank badges
        gold: "border-transparent bg-gradient-to-r from-rank-gold to-yellow-600 text-rank-gold-foreground shadow-[0_0_12px_hsl(var(--rank-gold)/0.5)]",
        silver:
          "border-transparent bg-gradient-to-r from-rank-silver to-gray-400 text-rank-silver-foreground shadow-[0_0_12px_hsl(var(--rank-silver)/0.4)]",
        bronze:
          "border-transparent bg-gradient-to-r from-rank-bronze to-orange-700 text-rank-bronze-foreground shadow-[0_0_12px_hsl(var(--rank-bronze)/0.4)]",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        glow: "animate-[glow-pulse_2s_ease-in-out_infinite]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      icon,
      removable,
      onRemove,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, animation }), className)}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    );
  },
);
Badge.displayName = "Badge";

// ============================================
// BADGE GROUP - For multiple badges
// ============================================

interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  children: React.ReactNode;
}

function BadgeGroup({ max, children, className, ...props }: BadgeGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const remainingCount = max ? childArray.length - max : 0;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} {...props}>
      {visibleChildren}
      {remainingCount > 0 && (
        <Badge variant="outline" size="sm">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// STATUS DOT - Simple status indicator
// ============================================

interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "online" | "offline" | "busy" | "away";
  pulse?: boolean;
}

function StatusDot({
  status,
  pulse = true,
  className,
  ...props
}: StatusDotProps) {
  const statusColors = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    busy: "bg-destructive",
    away: "bg-warning",
  };

  return (
    <span className={cn("relative inline-flex", className)} {...props}>
      <span className={cn("w-2.5 h-2.5 rounded-full", statusColors[status])} />
      {pulse && status === "online" && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            statusColors[status],
          )}
        />
      )}
    </span>
  );
}

export { Badge, BadgeGroup, StatusDot, badgeVariants };

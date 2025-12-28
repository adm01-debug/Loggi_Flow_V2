import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border border-border shadow-sm hover:shadow-md",
        elevated: "bg-card-elevated border border-border shadow-lg hover:shadow-xl",
        glass: "bg-card/80 backdrop-blur-xl border border-white/10 shadow-lg",
        gradient: "bg-gradient-to-br from-card via-card to-card-elevated border border-border/50 shadow-md hover:shadow-lg",
        outline: "bg-transparent border-2 border-border hover:border-primary/50",
        ghost: "bg-transparent hover:bg-card/50",
        interactive: [
          "bg-card border border-border shadow-sm cursor-pointer",
          "hover:shadow-lg hover:border-primary/30 hover:-translate-y-1",
          "active:translate-y-0 active:shadow-md",
        ].join(" "),
        premium: [
          "relative bg-card border border-border overflow-hidden",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:via-transparent before:to-primary/10",
          "after:absolute after:inset-[-1px] after:rounded-xl after:bg-gradient-to-r after:from-primary/20 after:via-transparent after:to-primary/20 after:-z-10",
          "shadow-lg hover:shadow-xl hover:shadow-primary/10",
        ].join(" "),
        success: "bg-success/5 border-2 border-success/30 shadow-success/10",
        warning: "bg-warning/5 border-2 border-warning/30 shadow-warning/10",
        danger: "bg-destructive/5 border-2 border-destructive/30 shadow-destructive/10",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-lg",
        glow: "hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
        scale: "hover:scale-[1.02]",
        border: "hover:border-primary/50",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "none",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, hover, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { gradient?: boolean }
>(({ className, gradient, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      gradient && "bg-gradient-to-r from-muted/50 to-transparent rounded-t-xl -m-6 mb-0 p-6",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { gradient?: boolean }
>(({ className, gradient, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-display font-bold leading-none tracking-tight",
      gradient && "bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { separated?: boolean }
>(({ className, separated, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      separated && "border-t border-border mt-4 pt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// ============================================
// STAT CARD - Pre-styled for statistics
// ============================================

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  variant?: "default" | "success" | "warning" | "danger";
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, variant = "default", className, ...props }, ref) => {
    const variantStyles = {
      default: "border-border bg-card",
      success: "border-success/30 bg-success/5",
      warning: "border-warning/30 bg-warning/5",
      danger: "border-destructive/30 bg-destructive/5",
    };
    
    const trendColors = {
      up: "text-success",
      down: "text-destructive",
      neutral: "text-muted-foreground",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-2">
          {icon && (
            <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
          )}
          {trend && (
            <span className={cn("text-sm font-semibold", trendColors[trend.direction])}>
              {trend.direction === "up" && "↑"}
              {trend.direction === "down" && "↓"}
              {trend.value}
            </span>
          )}
        </div>
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard, cardVariants };
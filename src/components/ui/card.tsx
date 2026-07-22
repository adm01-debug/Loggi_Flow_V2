import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const cardVariants = cva(
  "rounded-xl text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20",
        elevated: "bg-card-elevated border border-border shadow-xl hover:shadow-2xl hover:border-primary/30",
        glass: "bg-card/40 backdrop-blur-2xl border border-white/10 shadow-xl",
        gradient: "bg-gradient-to-br from-card via-card to-card-elevated border border-primary/10 shadow-lg hover:shadow-xl",
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
        default: "p-4 sm:p-6",
        sm: "p-3 sm:p-4",
        lg: "p-5 sm:p-8",
        xl: "p-6 sm:p-10",
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
      "flex flex-col space-y-1.5 p-4 sm:p-6",
      gradient && "bg-gradient-to-r from-muted/50 to-transparent rounded-t-xl -m-4 sm:-m-6 mb-0 p-4 sm:p-6",
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
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { separated?: boolean }
>(({ className, separated, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col sm:flex-row items-center gap-2 p-4 sm:p-6 pt-0",
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

// ============================================
// MAGNETIC CARD - 3D Hover Effect
// ============================================

interface MagneticCardProps {
  children: React.ReactNode;
  intensity?: number;
  glare?: boolean;
  className?: string;
}

const MagneticCard = ({ children, className, intensity = 10, glare = true }: MagneticCardProps) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]);
  
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative rounded-xl bg-card border border-border shadow-lg overflow-hidden",
        "transition-shadow duration-300 hover:shadow-xl",
        className
      )}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
        {/* Glare overlay */}
        {glare && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
            }}
          />
        )}
        
        {/* Content */}
        <div style={{ transform: "translateZ(50px)" }} className="relative z-0">
          {children}
        </div>
    </motion.div>
  );
};
MagneticCard.displayName = "MagneticCard";

// ============================================
// GLASS CARD - Glassmorphism Effect
// ============================================

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "sm" | "md" | "lg" | "xl";
  opacity?: number;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, blur = "lg", opacity = 0.8, children, ...props }, ref) => {
    const blurMap = { sm: "backdrop-blur-sm", md: "backdrop-blur-md", lg: "backdrop-blur-lg", xl: "backdrop-blur-xl" };
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border border-white/20 shadow-xl overflow-hidden",
          blurMap[blur],
          className
        )}
        style={{ backgroundColor: `hsl(var(--card) / ${opacity})` }}
        {...props}
      >
        {/* Glass highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  StatCard, 
  MagneticCard,
  GlassCard,
  // eslint-disable-next-line react-refresh/only-export-components
  cardVariants 
};
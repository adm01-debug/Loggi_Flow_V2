import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: 
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/25 hover:from-primary/95 hover:to-primary/85 active:shadow-sm active:scale-[0.98]",
        destructive: 
          "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg hover:shadow-destructive/25 active:shadow-sm active:scale-[0.98]",
        outline: 
          "border-2 border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 active:bg-accent/80 active:scale-[0.98]",
        secondary: 
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:shadow-none active:scale-[0.98]",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline active:opacity-80",
        premium: 
          "relative bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 overflow-hidden active:scale-[0.98]",
        success:
          "bg-gradient-to-r from-success to-success/90 text-success-foreground shadow-md hover:shadow-lg hover:shadow-success/25 active:shadow-sm active:scale-[0.98]",
        warning:
          "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground shadow-md hover:shadow-lg hover:shadow-warning/25 active:shadow-sm active:scale-[0.98]",
        glow:
          "relative bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] active:shadow-[0_0_15px_hsl(var(--primary)/0.4)] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-4 text-xs min-h-[36px]",
        lg: "h-12 rounded-lg px-8 text-base min-h-[48px]",
        xl: "h-14 rounded-xl px-10 text-lg min-h-[56px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
        "icon-sm": "h-8 w-8 min-h-[36px] min-w-[36px]",
        "icon-lg": "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  enableRipple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, enableRipple = true, children, disabled, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const Comp = asChild ? Slot : "button";

    const createRipple = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!enableRipple || disabled || loading) return;
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = Date.now();
      setRipples(prev => [...prev, { id, x, y, size }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }, [enableRipple, disabled, loading]);

    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }), "relative overflow-hidden")} 
        ref={ref} 
        disabled={disabled || loading}
        onMouseDown={createRipple}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Carregando...</span>
          </>
        ) : children}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.3 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
              }}
            />
          ))}
        </AnimatePresence>
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

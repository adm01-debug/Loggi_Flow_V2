/* eslint-disable max-lines */
import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { forwardRef, useState, useCallback } from "react";

// ============================================
// RIPPLE EFFECT FOR BUTTONS
// ============================================

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleContainerProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  disabled?: boolean;
}

export function RippleContainer({ children, className, rippleColor = "currentColor", disabled }: RippleContainerProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y, size }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  }, [disabled]);

  return (
    <div className={cn("relative overflow-hidden", className)} onMouseDown={createRipple}>
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: "50%",
              backgroundColor: rippleColor,
              pointerEvents: "none",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// STAGGER ANIMATIONS FOR LISTS
// ============================================

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  children: React.ReactNode;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay = 0.05, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: 0.1,
            },
          },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={{
          hidden: { opacity: 0, y: 20, scale: 0.95 },
          visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
          },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// ============================================
// MAGNETIC HOVER EFFECT
// ============================================

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function Magnetic({ children, className, strength = 0.3 }: MagneticProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) * strength;
    const y = (e.clientY - centerY) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      className={cn("inline-block", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 350, damping: 15 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// FADE IN ON SCROLL
// ============================================

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, direction = "up", delay = 0, duration = 0.5, className, ...props }, ref) => {
    const directions = {
      up: { y: 40, x: 0 },
      down: { y: -40, x: 0 },
      left: { x: 40, y: 0 },
      right: { x: -40, y: 0 },
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...directions[direction] }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";

// ============================================
// SCALE ON HOVER
// ============================================

interface ScaleHoverProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  scale?: number;
}

export const ScaleHover = forwardRef<HTMLDivElement, ScaleHoverProps>(
  ({ children, scale = 1.05, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ScaleHover.displayName = "ScaleHover";

// ============================================
// FLOATING ANIMATION
// ============================================

interface FloatingProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}

export function Floating({ children, className, duration = 3, distance = 10 }: FloatingProps) {
  return (
    <motion.div
      className={className}
      animate={{ y: [-distance, distance, -distance] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// PULSE GLOW ANIMATION
// ============================================

interface PulseGlowProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function PulseGlow({ children, className, color = "primary" }: PulseGlowProps) {
  return (
    <motion.div
      className={cn("relative", className)}
      animate={{
        boxShadow: [
          `0 0 10px hsl(var(--${color}) / 0.3)`,
          `0 0 30px hsl(var(--${color}) / 0.5)`,
          `0 0 10px hsl(var(--${color}) / 0.3)`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// COUNTER ANIMATION
// ============================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({ 
  value, 
  duration = 1, 
  className,
  prefix = "",
  suffix = "",
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayValue(eased * value);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

// ============================================
// SHAKE ANIMATION (for errors)
// ============================================

interface ShakeProps {
  children: React.ReactNode;
  trigger?: boolean;
  className?: string;
}

export function Shake({ children, trigger = false, className }: ShakeProps) {
  return (
    <motion.div
      className={className}
      animate={trigger ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// TYPEWRITER EFFECT
// ============================================

interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function Typewriter({ text, className, speed = 50, delay = 0 }: TypewriterProps) {
  const [displayText, setDisplayText] = React.useState("");
  
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    let index = 0;
    
    const startTyping = () => {
      const type = () => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
          timeout = setTimeout(type, speed);
        }
      };
      type();
    };
    
    const delayTimeout = setTimeout(startTyping, delay);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(delayTimeout);
    };
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
      />
    </span>
  );
}

// ============================================
// REVEAL ON SCROLL (using IntersectionObserver)
// ============================================

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

export function Reveal({ children, className, threshold = 0.1 }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
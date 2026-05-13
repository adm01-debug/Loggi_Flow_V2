import * as React from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";

export interface AnimatedNumberProps {
  value: number;
  className?: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatValue?: (v: any) => any;
}

export const AnimatedNumber = React.memo(
  ({ value, className, precision = 0, prefix = "", suffix = "", formatValue }: AnimatedNumberProps) => {
    const spring = useSpring(0, {
      mass: 0.8,
      stiffness: 75,
      damping: 15,
    });
    
    const displayValue = useTransform(spring, (current) => {
      const formatted = current.toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
      const val = `${prefix}${formatted}${suffix}`;
      return formatValue ? formatValue(current) : val;
    });

    React.useEffect(() => {
      spring.set(value);
    }, [value, spring]);

    return (
      <motion.span className={className}>
        {displayValue}
      </motion.span>
    );
  }
);

AnimatedNumber.displayName = "AnimatedNumber";

// FlipCounter Component
export const FlipCounter = ({ value, className }: { value: number; className?: string }) => {
  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// AnimatedProgressRing Component
export const AnimatedProgressRing = ({ progress, size = 40, strokeWidth = 4, className }: { progress: number; size?: number; strokeWidth?: number; className?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className={className}>
      <circle
        className="text-muted stroke-current"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <motion.circle
        className="text-primary stroke-current"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
};
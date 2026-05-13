import * as React from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  precision?: number;
}

export const AnimatedNumber = React.memo(
  ({ value, className, precision = 0 }: AnimatedNumberProps) => {
    const spring = useSpring(0, {
      mass: 0.8,
      stiffness: 75,
      damping: 15,
    });
    
    const displayValue = useTransform(spring, (current) => 
      current.toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })
    );

    React.useEffect(() => {
      spring.set(value);
      return undefined;
    }, [value, spring]);

    return (
      <motion.span className={className}>
        {displayValue}
      </motion.span>
    );
  }
);

AnimatedNumber.displayName = "AnimatedNumber";
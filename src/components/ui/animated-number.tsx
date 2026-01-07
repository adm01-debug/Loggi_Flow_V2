import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  duration = 1,
  formatValue,
  className,
  prefix = '',
  suffix = ''
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000
  });

  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current);
    if (formatValue) {
      return formatValue(rounded);
    }
    return rounded.toLocaleString('pt-BR');
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Counter com efeito de flip
interface FlipCounterProps {
  value: number;
  className?: string;
}

export function FlipCounter({ value, className }: FlipCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  const digits = String(displayValue).padStart(2, '0').split('');

  return (
    <div className={cn("flex gap-0.5", className)}>
      {digits.map((digit, index) => (
        <motion.div
          key={index}
          animate={{
            rotateX: isFlipping ? [0, -90, 0] : 0,
            scale: isFlipping ? [1, 0.9, 1] : 1
          }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="w-8 h-10 bg-gradient-to-b from-muted to-muted/80 rounded-md 
                     flex items-center justify-center text-lg font-bold
                     shadow-inner border border-border"
        >
          {digit}
        </motion.div>
      ))}
    </div>
  );
}

// Progress Ring animado
interface AnimatedProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export function AnimatedProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  color = 'primary'
}: AnimatedProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-amber-500',
    destructive: 'text-destructive'
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedNumber
            value={Math.round(percentage)}
            suffix="%"
            className="text-2xl font-bold"
          />
        </div>
      )}
    </div>
  );
}

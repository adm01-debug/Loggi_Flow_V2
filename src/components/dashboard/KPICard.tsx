import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  target?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  sparklineData?: number[];
  previousValue?: number;
  className?: string;
}

// Animated counter hook
function useAnimatedCounter(value: number, duration: number = 1) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration]);
  
  return displayValue;
}

// Mini sparkline component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const padding = 2;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={padding + (width - 2 * padding)}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
        r="3"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ 
    title, 
    value, 
    subtitle, 
    target, 
    icon: Icon, 
    trend, 
    trendValue, 
    status = 'neutral', 
    sparklineData, 
    previousValue, 
    className
  }, ref) => {
    const numericValue = typeof value === 'number' ? value : parseInt(value.toString()) || 0;
    const animatedValue = useAnimatedCounter(numericValue);
    
    const statusConfig = {
      success: {
        border: 'border-success/40 hover:border-success/60',
        bg: 'bg-gradient-to-br from-success/10 via-success/5 to-transparent',
        iconBg: 'bg-success/15 text-success ring-2 ring-success/20',
        glow: 'after:bg-success/20',
        sparkColor: 'hsl(var(--success))',
        trendColor: 'text-success',
        progressGradient: 'from-success to-success/80',
      },
      warning: {
        border: 'border-warning/40 hover:border-warning/60',
        bg: 'bg-gradient-to-br from-warning/10 via-warning/5 to-transparent',
        iconBg: 'bg-warning/15 text-warning ring-2 ring-warning/20',
        glow: 'after:bg-warning/20',
        sparkColor: 'hsl(var(--warning))',
        trendColor: 'text-warning',
        progressGradient: 'from-warning to-warning/80',
      },
      danger: {
        border: 'border-destructive/40 hover:border-destructive/60',
        bg: 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent',
        iconBg: 'bg-destructive/15 text-destructive ring-2 ring-destructive/20',
        glow: 'after:bg-destructive/20',
        sparkColor: 'hsl(var(--destructive))',
        trendColor: 'text-destructive',
        progressGradient: 'from-destructive to-destructive/80',
      },
      neutral: {
        border: 'border-border hover:border-primary/40',
        bg: 'bg-gradient-to-br from-card via-card to-card-elevated',
        iconBg: 'bg-primary/10 text-primary ring-2 ring-primary/20',
        glow: 'after:bg-primary/10',
        sparkColor: 'hsl(var(--primary))',
        trendColor: 'text-muted-foreground',
        progressGradient: 'from-primary to-primary/80',
      },
    };

    const config = statusConfig[status] || statusConfig.neutral;
    const progressPercent = target ? Math.min((numericValue / target) * 100, 100) : 0;
    
    // Calculate change percentage
    const changePercent = previousValue ? ((numericValue - previousValue) / previousValue * 100).toFixed(1) : null;

    let trendBgClass = 'bg-muted text-muted-foreground';
    let trendIcon = '';
    if (trend === 'up') {
      trendBgClass = 'bg-success/10 text-success';
      trendIcon = '↑';
    } else if (trend === 'down') {
      trendBgClass = 'bg-destructive/10 text-destructive';
      trendIcon = '↓';
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "group relative rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 transition-all duration-300 overflow-hidden cursor-default touch-manipulation",
          "hover:shadow-xl hover:shadow-foreground/5",
          "after:absolute after:inset-0 after:rounded-xl sm:after:rounded-2xl after:opacity-0 after:blur-2xl after:transition-opacity after:duration-500",
          "hover:after:opacity-100",
          config.border,
          config.bg,
          config.glow,
          className
        )}
      >
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl transition-all duration-300",
                "group-hover:shadow-lg",
                config.iconBg
              )}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
            
            <div className="flex flex-col items-end gap-1">
              {sparklineData && sparklineData.length > 1 && (
                <Sparkline data={sparklineData} color={config.sparkColor} />
              )}
              {(trendValue || changePercent !== null) && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full",
                  trendBgClass
                )}>
                  {trendIcon}
                  <span className="text-xs">{trendValue || `${changePercent}%`}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {title}
            </p>
            <motion.p 
              key={animatedValue}
              className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight bg-clip-text"
            >
              {typeof value === 'string' && value.includes('R$') ? value : animatedValue}
            </motion.p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium">{subtitle}</p>
            )}
          </div>

          {/* Progress bar */}
          {target && (
            <div className="mt-3 sm:mt-5">
              <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                <span>{progressPercent.toFixed(0)}% atingido</span>
                <span>Meta: {target}</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                  className={cn(
                    "h-full rounded-full relative overflow-hidden bg-gradient-to-r",
                    config.progressGradient
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);
KPICard.displayName = "KPICard";

export { KPICard };

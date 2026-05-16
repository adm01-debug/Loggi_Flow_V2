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
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${points} L ${padding + (width - 2 * padding)},${height} L ${padding},${height} Z`}
        fill={`url(#gradient-${color})`}
        className="opacity-40"
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <circle
        cx={padding + (width - 2 * padding)}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
        r="3"
        fill={color}
        className="animate-pulse shadow-lg"
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
    const numericValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
    const animatedValue = useAnimatedCounter(numericValue);

    const statusConfig = {
      success: {
        border: 'border-success/40 hover:border-success/60',
        bg: 'bg-gradient-to-br from-success/15 via-success/5 to-transparent',
        iconBg: 'bg-success/20 text-success ring-4 ring-success/10 shadow-[0_0_20px_rgba(34,197,94,0.3)]',
        glow: 'after:bg-success/20',
        sparkColor: 'hsl(var(--success))',
        trendColor: 'text-success',
        progressGradient: 'from-success to-success/80',
      },
      warning: {
        border: 'border-warning/40 hover:border-warning/60',
        bg: 'bg-gradient-to-br from-warning/15 via-warning/5 to-transparent',
        iconBg: 'bg-warning/20 text-warning ring-4 ring-warning/10 shadow-[0_0_20px_rgba(234,179,8,0.3)]',
        glow: 'after:bg-warning/20',
        sparkColor: 'hsl(var(--warning))',
        trendColor: 'text-warning',
        progressGradient: 'from-warning to-warning/80',
      },
      danger: {
        border: 'border-destructive/40 hover:border-destructive/60',
        bg: 'bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent',
        iconBg: 'bg-destructive/20 text-destructive ring-4 ring-destructive/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        glow: 'after:bg-destructive/20',
        sparkColor: 'hsl(var(--destructive))',
        trendColor: 'text-destructive',
        progressGradient: 'from-destructive to-destructive/80',
      },
      neutral: {
        border: 'border-border/60 hover:border-primary/40',
        bg: 'bg-gradient-to-br from-card via-card/50 to-card-elevated backdrop-blur-2xl',
        iconBg: 'bg-primary/15 text-primary ring-4 ring-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]',
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -10, 
          scale: 1.02,
          transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        className={cn(
          "group relative rounded-[2rem] border-2 p-6 transition-all duration-500 overflow-hidden cursor-default shadow-xl",
          "hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]",
          config.border,
          config.bg,
          className
        )}
      >
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Glossy Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.2 }}
              className={cn(
                "flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-lg border-b-4",
                config.iconBg
              )}
            >
              <Icon className="w-7 h-7" />
            </motion.div>
            
            <div className="flex flex-col items-end gap-2">
              {sparklineData && sparklineData.length > 1 && (
                <div className="bg-background/20 backdrop-blur-md p-1.5 rounded-xl border border-white/5">
                  <Sparkline data={sparklineData} color={config.sparkColor} />
                </div>
              )}
              {(trendValue || changePercent !== null) && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-widest",
                    trendBgClass,
                    trend === 'up' ? "border-success/20" : trend === 'down' ? "border-destructive/20" : "border-border/20"
                  )}
                >
                  <span className="text-sm leading-none">{trendIcon}</span>
                  <span>{trendValue || `${changePercent}%`}</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-1 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-full" />
              <p className="text-[10px] font-black text-muted-foreground/60 tracking-[0.2em] uppercase">
                {title}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.p 
                key={animatedValue}
                className="text-4xl lg:text-5xl font-display font-black tracking-tighter tabular-nums"
              >
                {typeof value === 'string' && value.includes('R$') 
                  ? <span className="text-foreground">{value}</span>
                  : <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text">{animatedValue}</span>
                }
              </motion.p>
              {status !== 'neutral' && (
                <div className={cn("w-2 h-2 rounded-full mb-2 animate-pulse", 
                  status === 'success' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-destructive'
                )} />
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground/80 font-bold uppercase tracking-tight italic">{subtitle}</p>
            )}
          </div>

          {target && (
            <div className="mt-8 relative pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{progressPercent.toFixed(0)}% PERFORMANCE</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">META: {target}</span>
              </div>
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-md border border-white/5 p-[1px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                  className={cn(
                    "h-full rounded-full relative overflow-hidden bg-gradient-to-r shadow-[0_0_15px_rgba(var(--primary),0.5)]",
                    config.progressGradient
                  )}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer" />
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

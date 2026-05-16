import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
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

// Animated counter hook with high precision
function useAnimatedCounter(value: number, duration: number = 1.5) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.34, 1.56, 0.64, 1], // Custom cubic-bezier for a "bouncy" but professional feel
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration]);
  
  return displayValue;
}

// Ultra-precise Sparkline with tactical aesthetic
function TacticalSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const padding = 4;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="relative group/sparkline">
      <svg width={width} height={height} className="overflow-visible filter drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">
        <defs>
          <linearGradient id={`spark-grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={`M ${points} L ${padding + (width - 2 * padding)},${height} L ${padding},${height} Z`}
          fill={`url(#spark-grad-${color})`}
          className="pointer-events-none"
        />
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          cx={padding + (width - 2 * padding)}
          cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
          r="3.5"
          fill={color}
          className="animate-pulse shadow-[0_0_10px_white]"
        />
      </svg>
    </div>
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
    const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, '')) || 0;
    const animatedValue = useAnimatedCounter(numericValue);
    
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const statusConfig = {
      success: {
        border: 'border-success/30 hover:border-success/60',
        bg: 'bg-gradient-to-br from-success/10 via-success/5 to-transparent',
        iconBg: 'bg-success/20 text-success ring-1 ring-success/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
        sparkColor: 'hsl(var(--success))',
        trendColor: 'text-success',
        accent: 'bg-success',
      },
      warning: {
        border: 'border-warning/30 hover:border-warning/60',
        bg: 'bg-gradient-to-br from-warning/10 via-warning/5 to-transparent',
        iconBg: 'bg-warning/20 text-warning ring-1 ring-warning/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
        sparkColor: 'hsl(var(--warning))',
        trendColor: 'text-warning',
        accent: 'bg-warning',
      },
      danger: {
        border: 'border-destructive/30 hover:border-destructive/60',
        bg: 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent',
        iconBg: 'bg-destructive/20 text-destructive ring-1 ring-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
        sparkColor: 'hsl(var(--destructive))',
        trendColor: 'text-destructive',
        accent: 'bg-destructive',
      },
      neutral: {
        border: 'border-white/10 hover:border-primary/40',
        bg: 'bg-black/40 backdrop-blur-xl',
        iconBg: 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.15)]',
        sparkColor: 'hsl(var(--primary))',
        trendColor: 'text-muted-foreground',
        accent: 'bg-primary',
      },
    };

    const config = statusConfig[status] || statusConfig.neutral;
    const progressPercent = target ? Math.min((numericValue / target) * 100, 100) : 0;
    const changePercent = previousValue ? ((numericValue - previousValue) / previousValue * 100).toFixed(1) : null;

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -8 }}
        className={cn(
          "group relative rounded-[2.5rem] border p-7 transition-all duration-500 overflow-hidden cursor-pointer",
          config.border,
          config.bg,
          className
        )}
      >
        {/* Dynamic Spotlight Glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(var(--primary-rgb), 0.1), transparent 40%)`
            ),
          }}
        />

        {/* Structural Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-8">
            <motion.div 
              whileHover={{ rotate: -10, scale: 1.1 }}
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-[1.25rem] transition-all duration-500 border-b-2",
                config.iconBg
              )}
            >
              <Icon className="w-8 h-8" />
            </motion.div>
            
            <div className="flex flex-col items-end gap-3">
              {sparklineData && (
                <div className="bg-white/5 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                  <TacticalSparkline data={sparklineData} color={config.sparkColor} />
                </div>
              )}
              {(trendValue || changePercent !== null) && (
                <motion.div 
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full border shadow-inner tracking-widest uppercase",
                    trend === 'up' ? "bg-success/10 text-success border-success/20" : 
                    trend === 'down' ? "bg-destructive/10 text-destructive border-destructive/20" : 
                    "bg-white/5 text-muted-foreground border-white/10"
                  )}
                >
                  <span className="text-sm font-bold">{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}</span>
                  <span>{trendValue || `${changePercent}%`}</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-2 h-0.5 rounded-full", config.accent)} />
              <span className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">{title}</span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <motion.span 
                className="text-5xl font-display font-black tracking-tighter tabular-nums bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
              >
                {typeof value === 'string' && value.includes('R$') ? value : animatedValue}
              </motion.span>
              {status !== 'neutral' && (
                <div className={cn("w-2 h-2 rounded-full mb-3 animate-pulse shadow-[0_0_8px_currentColor]", 
                  status === 'success' ? 'text-success bg-success' : 
                  status === 'warning' ? 'text-warning bg-warning' : 'text-destructive bg-destructive'
                )} />
              )}
            </div>
            
            {subtitle && (
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-tighter italic group-hover:text-white/50 transition-colors">
                {subtitle}
              </p>
            )}
          </div>

          {target && (
            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Performance Analysis</span>
                  <span className="text-[10px] font-black text-white/80">{progressPercent.toFixed(1)}% OF TARGET</span>
                </div>
                <div className="text-[10px] font-black px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                  GOAL: {target}
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
                  className={cn(
                    "h-full rounded-full relative bg-gradient-to-r from-transparent via-white/20 to-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]",
                    status === 'neutral' ? 'bg-primary' : config.accent
                  )}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" />
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

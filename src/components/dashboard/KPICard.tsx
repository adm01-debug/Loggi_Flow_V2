import * as React from "react";
import { LucideIcon, Cpu, Activity, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, animate, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

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
  performanceMode?: boolean;
  className?: string;
}

// Animated counter hook with high precision
function useAnimatedCounter(value: number, duration: number = 1.5) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.34, 1.56, 0.64, 1],
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
  const width = 100;
  const height = 40;
  const padding = 4;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="relative group/sparkline overflow-visible">
      <svg width={width} height={height} className="overflow-visible filter drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]">
        <defs>
          <linearGradient id={`spark-grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "circOut" }}
          d={`M ${points} L ${padding + (width - 2 * padding)},${height} L ${padding},${height} Z`}
          fill={`url(#spark-grad-${color})`}
          className="pointer-events-none"
        />
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "circOut" }}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 100 }}
          cx={padding + (width - 2 * padding)}
          cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
          r="4"
          fill={color}
          className="animate-pulse shadow-[0_0_15px_white]"
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
    performanceMode,
    className
  }, ref) => {
    const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, '')) || 0;
    const animatedValue = useAnimatedCounter(numericValue);
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseY, [0, 300], [5, -5]);
    const rotateY = useTransform(mouseX, [0, 400], [-5, 5]);

    const statusConfig = useMemo(() => ({
      success: {
        border: 'border-success/40 hover:border-success/80',
        bg: 'bg-gradient-to-br from-success/15 via-success/5 to-transparent',
        iconBg: 'bg-black text-success border-success/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]',
        sparkColor: 'hsl(var(--success))',
        trendColor: 'text-success',
        accent: 'bg-success',
        tag: 'OPTIMIZED',
      },
      warning: {
        border: 'border-warning/40 hover:border-warning/80',
        bg: 'bg-gradient-to-br from-warning/15 via-warning/5 to-transparent',
        iconBg: 'bg-black text-warning border-warning/40 shadow-[0_0_20px_rgba(234,179,8,0.3)]',
        sparkColor: 'hsl(var(--warning))',
        trendColor: 'text-warning',
        accent: 'bg-warning',
        tag: 'CAUTION',
      },
      danger: {
        border: 'border-destructive/40 hover:border-destructive/80',
        bg: 'bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent',
        iconBg: 'bg-black text-destructive border-destructive/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        sparkColor: 'hsl(var(--destructive))',
        trendColor: 'text-destructive',
        accent: 'bg-destructive',
        tag: 'CRITICAL',
      },
      neutral: {
        border: 'border-white/10 hover:border-primary/50',
        bg: 'bg-black/80 backdrop-blur-3xl',
        iconBg: 'bg-black text-primary border-primary/40 shadow-[0_0_20px_rgba(234,56,76,0.2)]',
        sparkColor: 'hsl(var(--primary))',
        trendColor: 'text-muted-foreground',
        accent: 'bg-primary',
        tag: 'NOMINAL',
      },
    }), []);

    const config = statusConfig[status] || statusConfig.neutral;
    const progressPercent = target ? Math.min((numericValue / target) * 100, 100) : 0;
    const changePercent = previousValue ? ((numericValue - previousValue) / previousValue * 100).toFixed(1) : null;

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
      const { left, top } = currentTarget.getBoundingClientRect();
      x.set(clientX - left);
      y.set(clientY - top);
    }

    function handleMouseLeave() {
      x.set(200);
      y.set(150);
    }

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, perspective: 1000 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "group relative rounded-[1.5rem] sm:rounded-[2.5rem] border-2 p-6 sm:p-8 transition-all duration-700 overflow-hidden cursor-pointer",
          config.border,
          config.bg,
          className
        )}
      >
        {/* Dynamic Spotlight Glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[1.5rem] sm:rounded-[2.5rem] opacity-0 transition duration-500 group-hover:opacity-100"
          style={{
            background: useTransform(
              [x, y],
              ([xv, yv]) => `radial-gradient(400px circle at ${xv}px ${yv}px, rgba(var(--primary-rgb), 0.2), transparent 40%)`
            ),
          }}
        />

        {/* Tactical Scanning Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 animate-scan transition-opacity duration-700" />

        {/* Tech Corner Labels */}
        <div className="absolute top-4 right-8 flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
          <span className="text-[7px] font-black text-white uppercase tracking-[0.4em]">Nexus_Protocol_{config.tag}</span>
          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-10">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-2xl border-2 transition-all duration-500",
                config.iconBg
              )}
            >
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
            </motion.div>
            
            <div className="flex flex-col items-end gap-4">
              {sparklineData && (
                <div className="bg-black/60 backdrop-blur-xl px-4 py-3 rounded-2xl border-2 border-white/10 group-hover:border-primary/40 transition-all duration-500 shadow-xl">
                  <TacticalSparkline data={sparklineData} color={config.sparkColor} />
                </div>
              )}
              {(trendValue || changePercent !== null) && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full border-2 shadow-2xl tracking-[0.2em] uppercase",
                    trend === 'up' ? "bg-success/20 text-success border-success/40" : 
                    trend === 'down' ? "bg-destructive/20 text-destructive border-destructive/40" : 
                    "bg-white/10 text-white/60 border-white/20"
                  )}
                >
                  {trend === 'up' ? <Activity className="w-3 h-3" /> : trend === 'down' ? <Activity className="w-3 h-3 rotate-180" /> : <Zap className="w-3 h-3" />}
                  <span>{trendValue || `${changePercent}%`} Delta</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("w-4 h-1 rounded-full", config.accent, "shadow-[0_0_10px_currentColor]")} />
              <span className="text-[11px] font-black text-white/50 tracking-[0.4em] uppercase italic italic">{title}</span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <motion.span 
                className="text-4xl sm:text-6xl font-display font-black tracking-tighter tabular-nums bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent italic"
              >
                {typeof value === 'string' && (value.includes('R$') || value.includes('%')) ? value : animatedValue}
              </motion.span>
              {status !== 'neutral' && (
                <div className={cn("w-3 h-3 rounded-full mb-4 animate-ping shadow-[0_0_15px_currentColor]", 
                  status === 'success' ? 'text-success bg-success' : 
                  status === 'warning' ? 'text-warning bg-warning' : 'text-destructive bg-destructive'
                )} />
              )}
            </div>
            
            {subtitle && (
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-primary/40" />
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-primary/60 transition-colors">
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          {target && (
            <div className="mt-10 space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-success/60" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Efficiency Grid Matrix</span>
                  </div>
                  <span className="text-sm font-black text-white tracking-tighter tabular-nums">
                    {progressPercent.toFixed(1)}% <span className="text-[10px] text-primary/60 uppercase ml-1">Threshold</span>
                  </span>
                </div>
                <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] font-black tracking-widest uppercase py-1 px-3 rounded-lg">
                  OBJETIVO: {target}
                </Badge>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden p-[2px] border-2 border-white/10 relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 2.5, ease: "circOut" }}
                  className={cn(
                    "h-full rounded-full relative shadow-[0_0_20px_rgba(255,255,255,0.3)]",
                    status === 'neutral' ? 'bg-gradient-to-r from-primary/50 to-primary' : `bg-gradient-to-r from-${status}/50 to-${status}`
                  )}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.3)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.3)_50%,rgba(255,255,255,0.3)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]" />
                </motion.div>
              </div>
            </div>
          )}

          {performanceMode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Real-time Flow Velocity</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1 h-3 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white italic">{(Math.random() * 5 + 92).toFixed(1)}%</span>
                <span className="text-[8px] font-bold text-white/40 uppercase">Completion Rate</span>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Corner Decoration */}
        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-r-2 border-b-2 border-primary/20 rounded-br-[2.5rem]" />
      </motion.div>
    );
  }
);
KPICard.displayName = "KPICard";

export { KPICard };

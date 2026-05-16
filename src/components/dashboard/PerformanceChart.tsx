import * as React from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PerformanceChartProps {
  title: string;
  subtitle?: string;
  type?: 'area' | 'bar' | 'pie';
  data: Array<Record<string, unknown>>;
  dataKey: string;
  secondaryDataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  className?: string;
}

const defaultColors = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--chart-5))',
];

const PerformanceChart = React.forwardRef<HTMLDivElement, PerformanceChartProps>(
  ({ 
    title, 
    subtitle, 
    type = 'area', 
    data, 
    dataKey, 
    secondaryDataKey,
    xAxisKey = 'name', 
    className, 
    colors = defaultColors
  }, ref) => {
    interface TooltipPayloadEntry {
      name: string;
      value: number | string;
      color?: string;
    }
    
    interface CustomTooltipProps {
      active?: boolean;
      payload?: TooltipPayloadEntry[];
      label?: string;
    }
    
    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-background/90 backdrop-blur-2xl border-2 border-primary/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-w-[150px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 border-b border-white/5 pb-2 italic">{label}</p>
            <div className="space-y-2">
              {payload.map((entry: TooltipPayloadEntry, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-black text-foreground/80 uppercase tracking-wider">{entry.name}:</span>
                  </div>
                  <span className="text-xs font-black text-primary tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
              <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Verificado Nexus</span>
            </div>
          </div>
        );
      }
      return null;
    };

    const renderChart = () => {
      switch (type) {
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={dataKey} 
                  radius={[4, 4, 0, 0]}
                  fill="hsl(var(--primary))"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        
        case 'pie':
          return (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey={dataKey}
                  paddingAngle={2}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          );
        
        default:
          return (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey={xAxisKey}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  name={dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrimary)"
                />
                {secondaryDataKey && (
                  <Area
                    type="monotone"
                    dataKey={secondaryDataKey}
                    name={secondaryDataKey.charAt(0).toUpperCase() + secondaryDataKey.slice(1)}
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSecondary)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          );
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-[2.5rem] border-2 p-6 sm:p-8 transition-all duration-500 overflow-hidden shadow-2xl bg-card/40 backdrop-blur-3xl group/chart",
          "border-primary/10 hover:border-primary/30 hover:shadow-primary/5",
          className
        )}
      >
        {/* Abstract Background Design */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] group-hover/chart:bg-primary/10 transition-colors duration-700" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              <h3 className="font-display font-black text-2xl tracking-tighter uppercase italic text-foreground leading-none">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-4 italic">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3 bg-background/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black text-foreground uppercase tracking-widest">Live Nexus Data</span>
            </div>
          </div>
        </div>

        <div className="w-full relative min-h-[250px] group/viz">
          {/* Glass Overlay for Chart Area */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-3xl" />
          {renderChart()}
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary border border-white/10" />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{dataKey}</span>
            </div>
            {secondaryDataKey && (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-success border border-white/10" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{secondaryDataKey}</span>
              </div>
            )}
          </div>
          <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
            Algoritmo Nexus v2.4
          </div>
        </div>
      </motion.div>
    );
  }
);
PerformanceChart.displayName = "PerformanceChart";

export { PerformanceChart };

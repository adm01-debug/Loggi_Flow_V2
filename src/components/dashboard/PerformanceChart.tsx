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
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, Terminal, Layers, Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
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
    
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="relative group/tooltip">
            <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity" />
            <div className="relative bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[200px]">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">{label}</p>
                <Terminal className="w-3 h-3 text-primary/40" />
              </div>
              <div className="space-y-3">
                {payload.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
                      <span className="text-[11px] font-black text-foreground/80 uppercase tracking-wider">{entry.name}:</span>
                    </div>
                    <span className="text-sm font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest">Nexus Verified</span>
                </div>
                <Activity className="w-3 h-3 text-primary/30" />
              </div>
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
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  {colors.map((color, i) => (
                    <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.3} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.03} strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar 
                  dataKey={dataKey} 
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGrad-${index % colors.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        
        case 'pie':
          return (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey={dataKey}
                  paddingAngle={8}
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]} 
                      className="hover:opacity-80 transition-opacity duration-300 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black text-2xl italic tracking-tighter">
                  {data.reduce((acc: any, curr: any) => acc + (Number(curr[dataKey]) || 0), 0)}
                </text>
                <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground font-black text-[10px] uppercase tracking-[0.2em]">
                  TOTAL
                </text>
              </PieChart>
            </ResponsiveContainer>
          );
        
        default:
          return (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaGradSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.03} strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisKey}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#areaGradPrimary)"
                  animationDuration={1500}
                />
                {secondaryDataKey && (
                  <Area
                    type="monotone"
                    dataKey={secondaryDataKey}
                    stroke="#10b981"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#areaGradSecondary)"
                    animationDuration={2000}
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn(
          "relative rounded-[3rem] border border-white/10 p-8 sm:p-10 transition-all duration-700 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-3xl group/chart",
          "hover:border-primary/30 hover:shadow-primary/5",
          className
        )}
      >
        {/* Background Grids & FX */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/chart:opacity-20 transition-all duration-700 group-hover/chart:scale-125">
          <TrendingUp className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between mb-10 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-black text-3xl tracking-tighter uppercase italic text-white leading-none group-hover/chart:translate-x-1 transition-transform">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                    <Layers className="w-3 h-3 text-primary/40" />
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <div className="h-10 px-5 flex items-center gap-3 bg-black/60 rounded-xl border border-white/10 shadow-inner group-hover/chart:border-primary/40 transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#3b82f6]" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap">Real-time Stream</span>
            </div>
          </div>
        </div>

        <div className="w-full relative min-h-[280px] group/viz">
          {/* Glass Overlay for Chart Area */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
          {renderChart()}
        </div>
        
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
          <div className="flex gap-6">
            <div className="flex items-center gap-3 group/legend cursor-pointer">
              <div className="w-4 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover/legend:w-8 transition-all" />
              <span className="text-[10px] font-black text-muted-foreground group-hover/legend:text-white uppercase tracking-widest italic transition-colors">{dataKey}</span>
            </div>
            {secondaryDataKey && (
              <div className="flex items-center gap-3 group/legend cursor-pointer">
                <div className="w-4 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover/legend:w-8 transition-all" />
                <span className="text-[10px] font-black text-muted-foreground group-hover/legend:text-white uppercase tracking-widest italic transition-colors">{secondaryDataKey}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">
              Nexus Analysis Engine
            </div>
            <Terminal className="w-3 h-3" />
          </div>
        </div>
      </motion.div>
    );
  }
);
PerformanceChart.displayName = "PerformanceChart";

export { PerformanceChart };

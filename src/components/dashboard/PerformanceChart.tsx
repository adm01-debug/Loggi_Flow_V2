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
import { TrendingUp, Activity, Terminal, Layers, Maximize2, RefreshCw, Hexagon, Zap } from "lucide-react";
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
            {/* Holographic Border Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary via-primary/40 to-white/20 blur-sm opacity-50 group-hover/tooltip:opacity-100 transition-opacity" />
            <div className="relative bg-[#050505]/95 backdrop-blur-2xl border border-white/10 rounded-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] min-w-[220px]">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-1">DATA NODE</span>
                  <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">{label}</p>
                </div>
                <Hexagon className="w-4 h-4 text-primary animate-spin-slow" />
              </div>
              <div className="space-y-4">
                {payload.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between gap-8 group/item">
                    <div className="flex items-center gap-3">
                      <div className="relative w-2 h-2">
                        <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: entry.color || entry.payload.fill }} />
                        <div className="relative w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
                      </div>
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover/item:text-white transition-colors">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                        {entry.value}
                      </span>
                      <span className="text-[8px] font-black text-white/20 uppercase">Units</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-[8px] font-black text-primary/80 uppercase tracking-widest">ENHANCED SYNCED</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-[7px] font-black text-primary">v10.0</div>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  {colors.map((color, i) => (
                    <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.2} />
                    </linearGradient>
                  ))}
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5" />
                  </filter>
                </defs>
                <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.03} strokeDasharray="5 5" />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                  dy={15}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }} 
                  animationDuration={300}
                />
                <Bar 
                  dataKey={dataKey} 
                  radius={[8, 8, 2, 2]}
                  barSize={36}
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
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  dataKey={dataKey}
                  paddingAngle={6}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={4}
                >
                  {data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]} 
                      className="hover:scale-105 transition-transform duration-500 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black text-3xl italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  {data.reduce((acc: any, curr: any) => acc + (Number(curr[dataKey]) || 0), 0)}
                </text>
                <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" className="fill-primary/60 font-black text-[10px] uppercase tracking-[0.3em]">
                  NEXUS TOTAL
                </text>
                <circle cx="50%" cy="50%" r="65" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
              </PieChart>
            </ResponsiveContainer>
          );
        
        default:
          return (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaGradSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.03} strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisKey}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                  dy={15}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke="#3b82f6"
                  strokeWidth={5}
                  fillOpacity={1}
                  fill="url(#areaGradPrimary)"
                  animationDuration={2000}
                />
                {secondaryDataKey && (
                  <Area
                    type="monotone"
                    dataKey={secondaryDataKey}
                    stroke="#10b981"
                    strokeWidth={5}
                    fillOpacity={1}
                    fill="url(#areaGradSecondary)"
                    animationDuration={2500}
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
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative rounded-[3.5rem] border-2 border-white/5 p-8 sm:p-12 transition-all duration-700 overflow-hidden shadow-2xl bg-[#0a0a0a]/60 backdrop-blur-3xl group/chart",
          "hover:border-primary/20 hover:shadow-[0_0_80px_rgba(59,130,246,0.1)]",
          className
        )}
      >
        {/* Advanced Decorative FX */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
        
        <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover/chart:opacity-10 transition-all duration-1000 group-hover/chart:rotate-12 group-hover/chart:scale-150">
          <Activity className="w-64 h-64 text-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 1, ease: "anticipate" }}
              className="p-4 rounded-3xl bg-primary/10 border border-primary/20 shadow-2xl relative"
            >
              <Activity className="w-8 h-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping opacity-50" />
            </motion.div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">OPERATIONAL METRICS</span>
                <div className="h-px w-12 bg-primary/20" />
              </div>
              <h3 className="font-display font-black text-4xl tracking-tighter uppercase italic text-white leading-none group-hover/chart:text-primary transition-colors duration-500">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-primary/60" />
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-inner">
              <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl hover:bg-white/5 hover:text-primary transition-all active:scale-95">
                <RefreshCw className="w-4.5 h-4.5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl hover:bg-white/5 hover:text-primary transition-all active:scale-95">
                <Maximize2 className="w-4.5 h-4.5" />
              </Button>
            </div>
            
            <div className="h-14 px-6 flex items-center gap-4 bg-gradient-to-r from-black/80 to-primary/5 rounded-2xl border border-white/10 shadow-2xl group-hover/chart:border-primary/40 transition-all duration-500">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary animate-ping opacity-30" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">LIVE STREAM</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] opacity-80">CONNECTED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full relative min-h-[300px] group/viz">
          {/* Enhanced Glass Fog */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10 opacity-60" />
          <div className="relative z-0">
            {renderChart()}
          </div>
        </div>
        
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-8 gap-6">
          <div className="flex flex-wrap gap-8">
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center gap-4 group/legend cursor-pointer"
            >
              <div className="relative h-2 w-8">
                <div className="absolute inset-0 rounded-full bg-primary opacity-20" />
                <div className="absolute inset-y-0 left-0 w-3 rounded-full bg-primary shadow-[0_0_15px_#3b82f6] group-hover/legend:w-8 transition-all duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Primary Metric</span>
                <span className="text-[11px] font-black text-white/80 group-hover/legend:text-white uppercase tracking-[0.2em] italic transition-colors">
                  {dataKey}
                </span>
              </div>
            </motion.div>
            
            {secondaryDataKey && (
              <motion.div 
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 group/legend cursor-pointer"
              >
                <div className="relative h-2 w-8">
                  <div className="absolute inset-0 rounded-full bg-[#10b981] opacity-20" />
                  <div className="absolute inset-y-0 left-0 w-3 rounded-full bg-[#10b981] shadow-[0_0_15px_#10b981] group-hover/legend:w-8 transition-all duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Secondary Metric</span>
                  <span className="text-[11px] font-black text-white/80 group-hover/legend:text-white uppercase tracking-[0.2em] italic transition-colors">
                    {secondaryDataKey}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all opacity-60 hover:opacity-100">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">NEXUS ENGINE</span>
              <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">OPERATIONAL HUB v10</span>
            </div>
            <Terminal className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </motion.div>
    );
  }
);
PerformanceChart.displayName = "PerformanceChart";

export { PerformanceChart };

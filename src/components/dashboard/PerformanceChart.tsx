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
import {
  Activity,
  Terminal,
  Maximize2,
  RefreshCw,
  Hexagon,
  Shield,
  Cpu,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PerformanceChartProps {
  title: string;
  subtitle?: string;
  type?: "area" | "bar" | "pie";
  data: Array<Record<string, unknown>>;
  dataKey: string;
  secondaryDataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  performanceMode?: boolean;
  className?: string;
}

const defaultColors = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
];

const PerformanceChart = React.forwardRef<
  HTMLDivElement,
  PerformanceChartProps
>(
  (
    {
      title,
      subtitle,
      type = "area",
      data,
      dataKey,
      secondaryDataKey,
      xAxisKey = "name",
      performanceMode,
      className,
      colors = defaultColors,
    },
    ref,
  ) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="relative group/tooltip">
            {/* Holographic Border Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary via-primary/40 to-white/20 blur-sm opacity-50 group-hover/tooltip:opacity-100 transition-opacity" />
            <div className="relative bg-[#050505]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.9)] min-w-[260px]">
              <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.5em] mb-1.5 flex items-center gap-2">
                    <Shield className="w-2.5 h-2.5" />
                    DATA NODE SECURED
                  </span>
                  <p className="text-sm font-black text-white uppercase tracking-widest italic">
                    {label}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Hexagon className="w-5 h-5 text-primary animate-spin-slow" />
                </div>
              </div>
              <div className="space-y-5">
                {payload.map((entry: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-8 group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-2.5 h-2.5">
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-50"
                          style={{
                            backgroundColor: entry.color || entry.payload.fill,
                          }}
                        />
                        <div
                          className="relative w-2.5 h-2.5 rounded-full shadow-[0_0_15px_currentColor]"
                          style={{
                            backgroundColor: entry.color || entry.payload.fill,
                            color: entry.color || entry.payload.fill,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] group-hover/item:text-white transition-colors">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                        {entry.value}
                      </span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">
                        UNITS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary/80 uppercase tracking-[0.3em]">
                    SYNAPSE-X READY
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-[8px] font-black text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  CORE v10.0
                </div>
              </div>
            </div>
          </div>
        );
      }
      return null;
    };

    const renderChart = () => {
      switch (type) {
        case "bar":
          return (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <defs>
                  {colors.map((color, i) => (
                    <linearGradient
                      key={`grad-${i}`}
                      id={`barGrad-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="white"
                  strokeOpacity={0.05}
                  strokeDasharray="10 10"
                />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{
                    fill: "rgba(255,255,255,0.5)",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={20}
                />
                <YAxis
                  tick={{
                    fill: "rgba(255,255,255,0.5)",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.03)", radius: 12 }}
                  animationDuration={400}
                />
                <Bar dataKey={dataKey} radius={[12, 12, 4, 4]} barSize={44}>
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#barGrad-${index % colors.length})`}
                      className="hover:opacity-80 transition-opacity duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );

        case "pie":
          return (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={125}
                  dataKey={dataKey}
                  paddingAngle={8}
                  stroke="rgba(0,0,0,0.8)"
                  strokeWidth={6}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      className="hover:scale-105 transition-transform duration-700 outline-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <g>
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white font-black text-5xl italic tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]"
                  >
                    {data.reduce(
                      (acc: any, curr: any) =>
                        acc + (Number(curr[dataKey]) || 0),
                      0,
                    )}
                  </text>
                  <text
                    x="50%"
                    y="56%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-primary/70 font-black text-[11px] uppercase tracking-[0.4em] italic"
                  >
                    NEXUS TOTAL
                  </text>
                </g>
                <circle
                  cx="50%"
                  cy="50%"
                  r="75"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  strokeDasharray="8 8"
                  className="animate-spin-slow"
                />
              </PieChart>
            </ResponsiveContainer>
          );

        default:
          return (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={data}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="areaGradPrimary"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="areaGradSecondary"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="white"
                  strokeOpacity={0.05}
                  strokeDasharray="8 8"
                />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{
                    fill: "rgba(255,255,255,0.5)",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={20}
                />
                <YAxis
                  tick={{
                    fill: "rgba(255,255,255,0.5)",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke="#3b82f6"
                  strokeWidth={6}
                  fillOpacity={1}
                  fill="url(#areaGradPrimary)"
                  animationDuration={3000}
                  strokeLinecap="round"
                />
                {secondaryDataKey && (
                  <Area
                    type="monotone"
                    dataKey={secondaryDataKey}
                    stroke="#10b981"
                    strokeWidth={6}
                    fillOpacity={1}
                    fill="url(#areaGradSecondary)"
                    animationDuration={3500}
                    strokeLinecap="round"
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
        initial={{ opacity: 0, scale: 0.95, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "relative rounded-[2rem] sm:rounded-[4rem] border-2 border-white/5 p-6 sm:p-16 transition-all duration-700 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-[#050505]/80 backdrop-blur-[40px] group/chart",
          "hover:border-primary/30 hover:shadow-[0_0_120px_rgba(59,130,246,0.15)]",
          className,
        )}
      >
        {/* Elite Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.2),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

        {/* Background Holographic Icon */}
        <div className="absolute -top-16 -right-16 p-12 opacity-[0.03] group-hover/chart:opacity-[0.08] transition-all duration-1000 group-hover/chart:rotate-45 group-hover/chart:scale-125 pointer-events-none">
          <Gauge className="w-96 h-96 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between mb-8 sm:mb-16 gap-6 sm:gap-10">
          <div className="flex items-start gap-4 sm:gap-8">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.15 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="mt-2 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative group/icon"
            >
              <Cpu className="w-7 h-7 sm:w-10 sm:h-10 text-primary group-hover/icon:text-white transition-colors duration-500" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-ping opacity-60" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full animate-pulse opacity-40" />
            </motion.div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.6em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  PREMIUM ANALYTICS
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent min-w-[60px]" />
              </div>
              <h3 className="font-display font-black text-3xl sm:text-5xl tracking-tighter uppercase italic text-white leading-none group-hover/chart:text-primary transition-colors duration-700 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs font-black text-white/50 uppercase tracking-[0.4em] mt-5 italic flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-primary" />
                  {subtitle}
                </p>
              )}
              {performanceMode && (
                <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 animate-pulse w-fit">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">
                    Live Flow Active
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex p-2 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-90 group/btn"
              >
                <RefreshCw className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-90 group/btn"
              >
                <Maximize2 className="w-5 h-5 group-hover/btn:scale-125 transition-transform duration-500" />
              </Button>
            </div>

            <div className="h-16 px-8 flex items-center gap-5 bg-gradient-to-r from-black/60 via-primary/10 to-transparent rounded-[2rem] border border-white/10 shadow-2xl group-hover/chart:border-primary/50 transition-all duration-700 group/status">
              <div className="relative">
                <div className="w-3.5 h-3.5 rounded-full bg-primary shadow-[0_0_15px_#3b82f6]" />
                <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-primary animate-ping opacity-40" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-none mb-1 group-hover/status:text-primary transition-colors">
                  NEXUS LINK
                </span>
                <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">
                  ENCRYPTED
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full relative min-h-[350px] group/viz">
          {/* Enhanced Depth Fog */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-10 opacity-80" />
          <div className="relative z-0">{renderChart()}</div>
        </div>

        <div className="mt-16 flex flex-col lg:flex-row items-center justify-between border-t border-white/10 pt-10 gap-8">
          <div className="flex flex-wrap gap-10">
            <motion.div
              whileHover={{ x: 8 }}
              className="flex items-center gap-5 group/legend cursor-pointer"
            >
              <div className="relative h-2.5 w-12">
                <div className="absolute inset-0 rounded-full bg-primary opacity-10" />
                <div className="absolute inset-y-0 left-0 w-4 rounded-full bg-primary shadow-[0_0_20px_#3b82f6] group-hover/legend:w-12 transition-all duration-700 ease-in-out" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-1">
                  DATA CORE 01
                </span>
                <span className="text-sm font-black text-white/70 group-hover/legend:text-primary uppercase tracking-[0.2em] italic transition-colors">
                  {dataKey}
                </span>
              </div>
            </motion.div>

            {secondaryDataKey && (
              <motion.div
                whileHover={{ x: 8 }}
                className="flex items-center gap-5 group/legend cursor-pointer"
              >
                <div className="relative h-2.5 w-12">
                  <div className="absolute inset-0 rounded-full bg-[#10b981] opacity-10" />
                  <div className="absolute inset-y-0 left-0 w-4 rounded-full bg-[#10b981] shadow-[0_0_20px_#10b981] group-hover/legend:w-12 transition-all duration-700 ease-in-out" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-1">
                    DATA CORE 02
                  </span>
                  <span className="text-sm font-black text-white/70 group-hover/legend:text-emerald-400 uppercase tracking-[0.2em] italic transition-colors">
                    {secondaryDataKey}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-5 px-8 py-4 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 shadow-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.5em]">
                SYSTEM ARCHITECT
              </span>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <Shield className="w-2.5 h-2.5" />
                ELITE PROTOCOL 10/10
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bottom Scanner FX */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20 animate-pulse" />
      </motion.div>
    );
  },
);
PerformanceChart.displayName = "PerformanceChart";

export { PerformanceChart };

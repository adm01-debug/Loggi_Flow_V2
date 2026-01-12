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
          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {payload.map((entry: TooltipPayloadEntry, index: number) => (
              <p key={index} className="text-sm text-muted-foreground">
                {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
              </p>
            ))}
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrimary)"
                />
              </AreaChart>
            </ResponsiveContainer>
          );
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("card-base", className)}
      >
        <div className="mb-3 sm:mb-4">
          <h3 className="font-display font-semibold text-base sm:text-lg">{title}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="w-full overflow-x-auto">
          {renderChart()}
        </div>
      </motion.div>
    );
  }
);
PerformanceChart.displayName = "PerformanceChart";

export { PerformanceChart };

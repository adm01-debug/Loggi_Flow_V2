import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter, RadialBarChart, RadialBar, Treemap
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Filter, Download, Maximize2,
  Calendar, RefreshCw, Info, ChevronDown, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================
// CHART COLOR PALETTE
// ============================================
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  destructive: 'hsl(var(--destructive))',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
};

const GRADIENT_COLORS = [
  { id: 'gradient-primary', start: '#3b82f6', end: '#1d4ed8' },
  { id: 'gradient-success', start: '#22c55e', end: '#16a34a' },
  { id: 'gradient-warning', start: '#f59e0b', end: '#d97706' },
  { id: 'gradient-danger', start: '#ef4444', end: '#dc2626' },
  { id: 'gradient-purple', start: '#8b5cf6', end: '#7c3aed' },
];

// ============================================
// CUSTOM TOOLTIP
// ============================================
interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  formatter?: (value: number) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter = (v) => v.toLocaleString('pt-BR')
}) => {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[150px]"
    >
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: TooltipPayloadEntry, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold">{formatter(entry.value)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================
// CHART WRAPPER
// ============================================
interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  loading?: boolean;
  onRefresh?: () => void;
  onDownload?: () => void;
  onExpand?: () => void;
  filters?: React.ReactNode;
  legend?: React.ReactNode;
  info?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  height = 300,
  loading,
  onRefresh,
  onDownload,
  onExpand,
  filters,
  legend,
  info
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {info && (
                <TooltipProvider>
                  <TooltipUI>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">{info}</p>
                    </TooltipContent>
                  </TooltipUI>
                </TooltipProvider>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {filters}
            
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onRefresh}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}
            
            {onDownload && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            {onExpand && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onExpand}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {legend}
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div style={{ height }} className="relative">
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center"
              >
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// INTERACTIVE BAR CHART
// ============================================
interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface InteractiveBarChartProps {
  data: BarChartData[];
  dataKeys: { key: string; name: string; color: string }[];
  title: string;
  subtitle?: string;
  stacked?: boolean;
  horizontal?: boolean;
  showLegend?: boolean;
  formatter?: (value: number) => string;
  onBarClick?: (data: BarChartData) => void;
}

export const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({
  data,
  dataKeys,
  title,
  subtitle,
  stacked = false,
  horizontal = false,
  showLegend = true,
  formatter = (v) => v.toLocaleString('pt-BR'),
  onBarClick
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            {GRADIENT_COLORS.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.start} stopOpacity={1} />
                <stop offset="100%" stopColor={g.end} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5} 
          />
          
          {horizontal ? (
            <>
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            </>
          )}
          
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          )}
          
          {dataKeys.map((dk, index) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.name}
              fill={dk.color}
              stackId={stacked ? 'stack' : undefined}
              radius={stacked ? (index === dataKeys.length - 1 ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]}
              onClick={onBarClick}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

// ============================================
// INTERACTIVE LINE CHART
// ============================================
interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface InteractiveLineChartProps {
  data: LineChartData[];
  dataKeys: { key: string; name: string; color: string }[];
  title: string;
  subtitle?: string;
  showArea?: boolean;
  showDots?: boolean;
  curved?: boolean;
  formatter?: (value: number) => string;
  onPointClick?: () => void;
}

export const InteractiveLineChart: React.FC<InteractiveLineChartProps> = ({
  data,
  dataKeys,
  title,
  subtitle,
  showArea = false,
  showDots = true,
  curved = true,
  formatter = (v) => v.toLocaleString('pt-BR'),
  onPointClick
}) => {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  const ChartComponent = showArea ? AreaChart : LineChart;
  const DataComponent = showArea ? Area : Line;

  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            {dataKeys.map((dk) => (
              <linearGradient key={`area-${dk.key}`} id={`area-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dk.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={dk.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5} 
          />
          
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-sm">{value}</span>}
            onMouseEnter={(o) => setHoveredLine(o.dataKey as string)}
            onMouseLeave={() => setHoveredLine(null)}
          />
          
          {dataKeys.map((dk) => (
            showArea ? (
              <Area
                key={dk.key}
                type={curved ? 'monotone' : 'linear'}
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color}
                fill={`url(#area-${dk.key})`}
                strokeWidth={hoveredLine === dk.key ? 3 : 2}
                dot={showDots ? { r: 4, fill: dk.color } : false}
                activeDot={{ r: 6, stroke: dk.color, strokeWidth: 2, fill: 'white' }}
                onClick={onPointClick}
              />
            ) : (
              <Line
                key={dk.key}
                type={curved ? 'monotone' : 'linear'}
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color}
                strokeWidth={hoveredLine === dk.key ? 3 : 2}
                dot={showDots ? { r: 4, fill: dk.color } : false}
                activeDot={{ r: 6, stroke: dk.color, strokeWidth: 2, fill: 'white' }}
                onClick={onPointClick}
              />
            )
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

// ============================================
// INTERACTIVE PIE/DONUT CHART
// ============================================
interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface InteractivePieChartProps {
  data: PieChartData[];
  title: string;
  subtitle?: string;
  donut?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  formatter?: (value: number) => string;
  onSliceClick?: (data: PieChartData) => void;
}

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({
  data,
  title,
  subtitle,
  donut = true,
  showLabels = true,
  showLegend = true,
  formatter = (v) => v.toLocaleString('pt-BR'),
  onSliceClick
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const colors = [
    CHART_COLORS.chart1,
    CHART_COLORS.chart2,
    CHART_COLORS.chart3,
    CHART_COLORS.chart4,
    CHART_COLORS.chart5,
  ];
  
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={donut ? '60%' : 0}
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            onClick={onSliceClick}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            label={showLabels ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : undefined}
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
                stroke="transparent"
                style={{
                  filter: activeIndex === index ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : undefined,
                  transform: activeIndex === index ? 'scale(1.05)' : undefined,
                  transformOrigin: 'center',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Pie>
          
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          
          {showLegend && (
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry) => {
                const payload = entry.payload as unknown as PieChartData | undefined;
                return (
                  <span className="text-sm">
                    {value} ({payload ? ((payload.value / total) * 100).toFixed(1) : 0}%)
                  </span>
                );
              }}
            />
          )}
          
          {/* Center text for donut */}
          {donut && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
            >
              <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
                {formatter(total)}
              </tspan>
              <tspan x="50%" dy="1.5em" className="text-sm fill-muted-foreground">
                Total
              </tspan>
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

// ============================================
// COMPOSED CHART (Multiple chart types)
// ============================================
interface ComposedChartData {
  name: string;
  [key: string]: string | number;
}

interface ComposedDataKey {
  key: string;
  name: string;
  color: string;
  type: 'bar' | 'line' | 'area';
  yAxisId?: 'left' | 'right';
}

interface InteractiveComposedChartProps {
  data: ComposedChartData[];
  dataKeys: ComposedDataKey[];
  title: string;
  subtitle?: string;
  showSecondYAxis?: boolean;
  formatter?: (value: number) => string;
}

export const InteractiveComposedChart: React.FC<InteractiveComposedChartProps> = ({
  data,
  dataKeys,
  title,
  subtitle,
  showSecondYAxis = false,
  formatter = (v) => v.toLocaleString('pt-BR')
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          
          {showSecondYAxis && (
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
            />
          )}
          
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          
          {dataKeys.map((dk) => {
            const yAxisId = dk.yAxisId || 'left';
            
            switch (dk.type) {
              case 'bar':
                return (
                  <Bar 
                    key={dk.key}
                    dataKey={dk.key} 
                    name={dk.name} 
                    fill={dk.color} 
                    yAxisId={yAxisId}
                    radius={[4, 4, 0, 0]}
                  />
                );
              case 'line':
                return (
                  <Line 
                    key={dk.key}
                    type="monotone" 
                    dataKey={dk.key} 
                    name={dk.name} 
                    stroke={dk.color}
                    strokeWidth={2}
                    yAxisId={yAxisId}
                    dot={{ r: 4, fill: dk.color }}
                  />
                );
              case 'area':
                return (
                  <Area 
                    key={dk.key}
                    type="monotone" 
                    dataKey={dk.key} 
                    name={dk.name} 
                    fill={dk.color}
                    stroke={dk.color}
                    fillOpacity={0.3}
                    yAxisId={yAxisId}
                  />
                );
              default:
                return null;
            }
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

// ============================================
// RADIAL PROGRESS CHART
// ============================================
interface RadialProgressProps {
  value: number;
  maxValue?: number;
  title: string;
  subtitle?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RadialProgress: React.FC<RadialProgressProps> = ({
  value,
  maxValue = 100,
  title,
  subtitle,
  color = CHART_COLORS.primary,
  size = 'md'
}) => {
  const percentage = (value / maxValue) * 100;
  const sizes = { sm: 120, md: 160, lg: 200 };
  const chartSize = sizes[size];

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center">
        <div style={{ width: chartSize, height: chartSize }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              data={[{ value: percentage, fill: color }]}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: 'hsl(var(--muted))' }}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
              >
                <tspan className="text-2xl font-bold">{value}</tspan>
                <tspan className="text-sm fill-muted-foreground">/{maxValue}</tspan>
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        <h4 className="text-sm font-medium mt-2">{title}</h4>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};

// ============================================
// CHART PRESETS
// ============================================
export const ChartPresets = {
  colors: CHART_COLORS,
  gradients: GRADIENT_COLORS,
};

export default {
  ChartWrapper,
  InteractiveBarChart,
  InteractiveLineChart,
  InteractivePieChart,
  InteractiveComposedChart,
  RadialProgress,
  ChartPresets
};

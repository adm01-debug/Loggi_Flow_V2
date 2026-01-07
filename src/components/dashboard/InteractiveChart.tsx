import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  LineChartIcon,
  AreaChartIcon,
  PieChartIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChartType = "area" | "bar" | "line" | "pie";

interface DataPoint {
  [key: string]: string | number;
}

interface InteractiveChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  dataKeys: { key: string; color: string; name: string }[];
  xAxisKey: string;
  defaultChartType?: ChartType;
  allowTypeSwitch?: boolean;
  showBrush?: boolean;
  showTrend?: boolean;
  onDataPointClick?: (data: DataPoint, key: string) => void;
  className?: string;
  height?: number;
}

const CHART_TYPES: { type: ChartType; icon: React.ReactNode; label: string }[] = [
  { type: "area", icon: <AreaChartIcon className="w-4 h-4" />, label: "Área" },
  { type: "bar", icon: <BarChart3 className="w-4 h-4" />, label: "Barras" },
  { type: "line", icon: <LineChartIcon className="w-4 h-4" />, label: "Linha" },
  { type: "pie", icon: <PieChartIcon className="w-4 h-4" />, label: "Pizza" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 min-w-[150px]"
    >
      <p className="font-medium text-sm mb-2 text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function calculateTrend(data: DataPoint[], key: string): "up" | "down" | "stable" {
  if (data.length < 2) return "stable";
  const values = data.map((d) => Number(d[key]) || 0);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  if (avgSecond > avgFirst * 1.05) return "up";
  if (avgSecond < avgFirst * 0.95) return "down";
  return "stable";
}

export function InteractiveChart({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey,
  defaultChartType = "area",
  allowTypeSwitch = true,
  showBrush = false,
  showTrend = true,
  onDataPointClick,
  className,
  height = 300,
}: InteractiveChartProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const trend = showTrend && dataKeys[0] ? calculateTrend(data, dataKeys[0].key) : "stable";

  const resetZoom = () => {};


  const exportChart = () => {
    // Simple CSV export
    const headers = [xAxisKey, ...dataKeys.map((k) => k.key)].join(",");
    const rows = data.map((row) =>
      [row[xAxisKey], ...dataKeys.map((k) => row[k.key])].join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDataKeys = selectedKey
    ? dataKeys.filter((k) => k.key === selectedKey)
    : dataKeys;

  const renderChart = () => {
    if (chartType === "pie") {
      const pieData = dataKeys.map((dk) => ({
        name: dk.name,
        value: data.reduce((sum, d) => sum + (Number(d[dk.key]) || 0), 0),
        color: dk.color,
      }));

      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              innerRadius={height / 5}
              paddingAngle={2}
              animationBegin={0}
              animationDuration={800}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => onDataPointClick?.(entry as any, entry.name)}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const ChartComponent = chartType === "bar" ? BarChart : chartType === "line" ? LineChart : AreaChart;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {filteredDataKeys.map((dk) => (
              <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dk.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={dk.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
          <Legend
            onClick={(e) => setSelectedKey(selectedKey === e.dataKey ? null : (e.dataKey as string))}
            wrapperStyle={{ cursor: "pointer" }}
          />
          {showTrend && data.length > 1 && (
            <ReferenceLine
              y={data.reduce((sum, d) => sum + (Number(d[dataKeys[0]?.key]) || 0), 0) / data.length}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              opacity={0.5}
            />
          )}
          {filteredDataKeys.map((dk) =>
            chartType === "bar" ? (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name}
                fill={dk.color}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                className="cursor-pointer"
              />
            ) : chartType === "line" ? (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color}
                strokeWidth={2}
                dot={{ fill: dk.color, r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                animationDuration={800}
                className="cursor-pointer"
              />
            ) : (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color}
                strokeWidth={2}
                fill={`url(#gradient-${dk.key})`}
                animationDuration={800}
                className="cursor-pointer"
              />
            )
          )}
          {showBrush && (
            <Brush
              dataKey={xAxisKey}
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted)/0.3)"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {showTrend && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    trend === "up" && "text-success border-success/30",
                    trend === "down" && "text-destructive border-destructive/30",
                    trend === "stable" && "text-muted-foreground"
                  )}
                >
                  {trend === "up" && <TrendingUp className="w-3 h-3 mr-1" />}
                  {trend === "down" && <TrendingDown className="w-3 h-3 mr-1" />}
                  {trend === "stable" && <Minus className="w-3 h-3 mr-1" />}
                  {trend === "up" ? "Alta" : trend === "down" ? "Baixa" : "Estável"}
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-1">
            {allowTypeSwitch && (
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
                {CHART_TYPES.map((ct) => (
                  <Button
                    key={ct.type}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-md",
                      chartType === ct.type && "bg-background shadow-sm"
                    )}
                    onClick={() => setChartType(ct.type)}
                    title={ct.label}
                  >
                    {ct.icon}
                  </Button>
                ))}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={resetZoom}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar Zoom
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportChart}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={chartType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderChart()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildLatencyTrend, type LatencySample } from "@/lib/rodonaves/latencyTrend";

export interface RTELatencyTrendChartProps {
  samples: LatencySample[];
  /** Rótulos amigáveis por gateway. */
  labels?: Record<string, string>;
  className?: string;
}

/**
 * Gráfico de tendência de latência (média e P95) por bucket horário,
 * com filtro por gateway e sinalização de degradação sustentada.
 */
export function RTELatencyTrendChart({ samples, labels = {}, className }: RTELatencyTrendChartProps) {
  const [gateway, setGateway] = useState<string>("__all__");

  const gateways = useMemo(
    () => Array.from(new Set(samples.map((s) => s.gateway))).sort(),
    [samples],
  );

  const trend = useMemo(
    () => buildLatencyTrend(samples, { gateway: gateway === "__all__" ? undefined : gateway }),
    [samples, gateway],
  );

  if (trend.points.length === 0) {
    return null;
  }

  const DriftIcon = trend.driftPct >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className={cn("rounded-lg border border-border p-3", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Tendência de latência</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <DriftIcon className="h-3 w-3" aria-hidden />
            Variação de {trend.driftPct >= 0 ? "+" : ""}
            {trend.driftPct.toFixed(1)}% na segunda metade da janela
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {trend.degrading && (
            <Badge
              variant="outline"
              className="border-destructive/20 bg-destructive/10 text-xs text-destructive"
            >
              Degradação
            </Badge>
          )}
          <Button
            variant={gateway === "__all__" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setGateway("__all__")}
          >
            Todos
          </Button>
          {gateways.map((item) => (
            <Button
              key={item}
              variant={gateway === item ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setGateway(item)}
            >
              {labels[item] ?? item}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend.points} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="rte-latency-avg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={48}
              unit="ms"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                color: "hsl(var(--popover-foreground))",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [`${value}ms`, name]}
              labelFormatter={(label: string) => `Bucket ${label}`}
            />
            <Area
              type="monotone"
              dataKey="avgLatencyMs"
              name="Média"
              stroke="hsl(var(--primary))"
              fill="url(#rte-latency-avg)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="p95LatencyMs"
              name="P95"
              stroke="hsl(var(--destructive))"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

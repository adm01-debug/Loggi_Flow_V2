import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  target?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  target,
  icon: Icon,
  trend,
  trendValue,
  status = 'neutral',
  className,
}: KPICardProps) {
  const statusColors = {
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
    neutral: 'border-border bg-card',
  };

  const statusIconColors = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-destructive bg-destructive/10',
    neutral: 'text-primary bg-primary/10',
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const progressPercent = target ? Math.min((Number(value) / target) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl border p-5 transition-all duration-300 hover:shadow-lg overflow-hidden",
        statusColors[status],
        className
      )}
    >
      {/* Glow effect for success/danger states */}
      {status !== 'neutral' && (
        <div 
          className={cn(
            "absolute inset-0 opacity-20 blur-xl",
            status === 'success' && "bg-success",
            status === 'warning' && "bg-warning",
            status === 'danger' && "bg-destructive",
          )}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            statusIconColors[status]
          )}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && trendValue && (
            <span className={cn("text-sm font-medium", trendColors[trend])}>
              {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {target && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>Meta: {target}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  status === 'success' && "bg-success",
                  status === 'warning' && "bg-warning",
                  status === 'danger' && "bg-destructive",
                  status === 'neutral' && "bg-primary",
                )}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: "primary" | "success" | "warning" | "destructive" | "info";
  className?: string;
  loading?: boolean;
}

const colorClasses = {
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  destructive: "text-destructive bg-destructive/10",
  info: "text-info bg-info/10",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = "primary",
  className,
  loading = false,
}: StatsCardProps) {
  return (
    <motion.div
      className={cn("stat-card", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label={`Métrica: ${title}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-lg", colorClasses[color])} aria-hidden="true">
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div 
            className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}
            aria-label={`Tendência: ${trend >= 0 ? "Aumento" : "Queda"} de ${Math.abs(trend)}%`}
          >
            <span aria-hidden="true">{trend >= 0 ? "↑" : "↓"}</span>
            <span className="ml-1" aria-hidden="true">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-20 mb-1"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {trendLabel && (
            <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
          )}
        </>
      )}
    </motion.div>
  );
}

// Variante compacta
export function StatsCardCompact({
  title,
  value,
  icon: Icon,
  color = "primary",
}: Omit<StatsCardProps, "trend" | "trendLabel" | "loading">) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={cn("p-2 rounded-lg", colorClasses[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-lg font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

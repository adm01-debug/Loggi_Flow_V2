import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusConfigs, type StatusType } from "./statusHelpers";

export { getStatusLabel, getStatusColor, statusOptions } from "./statusHelpers";
export type { StatusType } from "./statusHelpers";

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function StatusBadge({ status, showIcon = true, size = "default", className }: StatusBadgeProps) {
  const config = statusConfigs[status as StatusType] || {
    label: status,
    variant: "outline" as const,
    className: "bg-muted/50",
    icon: undefined,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0",
    default: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "font-medium border",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn("mr-1", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      {config.label}
    </Badge>
  );
}

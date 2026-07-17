import { LucideIcon, SearchX, Database, Truck, Bell, Users, AlertCircle, Inbox, Calendar, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "search" | "data" | "delivery" | "notifications" | "users" | "error" | "inbox" | "calendar" | "default" | "location";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const variantConfig: Record<EmptyStateVariant, { icon: LucideIcon; color: string }> = {
  search: { icon: SearchX, color: "text-primary" },
  data: { icon: Database, color: "text-muted-foreground" },
  delivery: { icon: Truck, color: "text-primary" },
  notifications: { icon: Bell, color: "text-warning" },
  users: { icon: Users, color: "text-info" },
  error: { icon: AlertCircle, color: "text-destructive" },
  inbox: { icon: Inbox, color: "text-muted-foreground" },
  calendar: { icon: Calendar, color: "text-info" },
  default: { icon: Plus, color: "text-primary" },
  location: { icon: MapPin, color: "text-primary" },
};

export function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  const sizeClasses = {
    sm: "py-6 px-4",
    md: "py-12 px-6",
    lg: "py-20 px-8",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const ringSizes = {
    sm: "ring-4",
    md: "ring-8",
    lg: "ring-12",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/20",
        sizeClasses[size],
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 mb-4",
        ringSizes[size],
        "ring-primary/5",
        { sm: "w-12 h-12", md: "w-16 h-16", lg: "w-24 h-24" }[size]
      )}>
        <Icon className={cn(iconSizes[size], config.color)} />
      </div>
      <h3 className={cn(
        "font-display font-semibold text-foreground mb-2",
        size === "sm" ? "text-base" : size === "md" ? "text-xl" : "text-2xl"
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-xs mb-6 text-balance",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline" size={size === "sm" ? "sm" : "default"} className="shadow-lg shadow-primary/5">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

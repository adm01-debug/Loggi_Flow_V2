import { LucideIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 ${className}`}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 ring-8 ring-primary/5">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-display font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-xs mb-6 text-balance">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="shadow-lg shadow-primary/20">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

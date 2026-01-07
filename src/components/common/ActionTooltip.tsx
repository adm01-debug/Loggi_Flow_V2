import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActionTooltipProps {
  children: ReactNode;
  label: string;
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  className?: string;
  asChild?: boolean;
}

export function ActionTooltip({
  children,
  label,
  shortcut,
  side = "top",
  align = "center",
  delayDuration = 200,
  className,
  asChild = true,
}: ActionTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            "flex items-center gap-2 bg-popover border-border shadow-lg",
            className
          )}
        >
          <span className="text-sm font-medium">{label}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Wrapper para ícones com tooltip
interface IconWithTooltipProps {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function IconWithTooltip({
  icon,
  label,
  shortcut,
  onClick,
  className,
  disabled = false,
}: IconWithTooltipProps) {
  return (
    <ActionTooltip label={label} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        aria-label={label}
      >
        {icon}
      </button>
    </ActionTooltip>
  );
}

// Quick Action Button com tooltip integrado
interface QuickActionProps {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const variantStyles = {
  default: "hover:bg-accent hover:text-accent-foreground",
  primary: "hover:bg-primary/10 hover:text-primary",
  danger: "hover:bg-destructive/10 hover:text-destructive",
  success: "hover:bg-success/10 hover:text-success",
};

const sizeStyles = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
};

export function QuickAction({
  icon,
  label,
  shortcut,
  onClick,
  variant = "default",
  size = "md",
  disabled = false,
}: QuickActionProps) {
  return (
    <ActionTooltip label={label} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "rounded-lg transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95",
          variantStyles[variant],
          sizeStyles[size]
        )}
        aria-label={label}
      >
        {icon}
      </button>
    </ActionTooltip>
  );
}

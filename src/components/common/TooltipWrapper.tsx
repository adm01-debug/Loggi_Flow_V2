import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info, HelpCircle, Lightbulb, AlertCircle, CheckCircle } from "lucide-react";

// ============================================
// TOOLTIP WRAPPER - PREMIUM VERSION
// Enhanced tooltips with multiple styles
// ============================================

type TooltipVariant = 'default' | 'info' | 'help' | 'tip' | 'warning' | 'success';

interface TooltipWrapperProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  variant?: TooltipVariant;
  title?: string;
  shortcut?: string;
}

const variantConfig: Record<TooltipVariant, { icon: typeof Info; className: string }> = {
  default: { icon: Info, className: '' },
  info: { icon: Info, className: 'bg-blue-500 text-white border-blue-600' },
  help: { icon: HelpCircle, className: 'bg-purple-500 text-white border-purple-600' },
  tip: { icon: Lightbulb, className: 'bg-amber-500 text-white border-amber-600' },
  warning: { icon: AlertCircle, className: 'bg-orange-500 text-white border-orange-600' },
  success: { icon: CheckCircle, className: 'bg-green-500 text-white border-green-600' },
};

export function TooltipWrapper({ 
  children, 
  content, 
  side = "top", 
  align = "center", 
  delayDuration = 300,
  variant = 'default',
  title,
  shortcut,
}: TooltipWrapperProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className={cn(
            "max-w-xs",
            variant !== 'default' && config.className
          )}
        >
          <div className="flex items-start gap-2">
            {variant !== 'default' && (
              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              {title && (
                <p className="font-semibold text-sm mb-0.5">{title}</p>
              )}
              <div className="text-sm">{content}</div>
              {shortcut && (
                <kbd className="mt-1 inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium opacity-75">
                  {shortcut}
                </kbd>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// HOVER CARD TOOLTIP - Rich content on hover
// ============================================

interface HoverCardTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function HoverCardTooltip({
  children,
  content,
  side = "top",
  className,
}: HoverCardTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: side === 'bottom' ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'bottom' ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 min-w-[200px] rounded-lg border bg-popover p-3 shadow-lg",
              side === 'top' && "bottom-full mb-2 left-1/2 -translate-x-1/2",
              side === 'bottom' && "top-full mt-2 left-1/2 -translate-x-1/2",
              side === 'left' && "right-full mr-2 top-1/2 -translate-y-1/2",
              side === 'right' && "left-full ml-2 top-1/2 -translate-y-1/2",
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// CONTEXTUAL HELP ICON
// ============================================

interface ContextualHelpProps {
  content: ReactNode;
  title?: string;
  variant?: TooltipVariant;
  iconSize?: 'sm' | 'md' | 'lg';
}

export function ContextualHelp({ 
  content, 
  title,
  variant = 'help',
  iconSize = 'sm',
}: ContextualHelpProps) {
  const sizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <TooltipWrapper content={content} title={title} variant={variant}>
      <button className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
        <HelpCircle className={sizes[iconSize]} />
      </button>
    </TooltipWrapper>
  );
}

export default TooltipWrapper;

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  showOnce?: boolean;
  delay?: number;
  onAction?: () => void;
  actionLabel?: string;
}

const DISMISSED_TOOLTIPS_KEY = 'loggi-flow-dismissed-tooltips';

export function OnboardingTooltip({
  id,
  title,
  description,
  position = 'bottom',
  children,
  showOnce = true,
  delay = 1000,
  onAction,
  actionLabel = 'Entendi'
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if tooltip was already dismissed
    const dismissed = localStorage.getItem(DISMISSED_TOOLTIPS_KEY);
    const dismissedList: string[] = dismissed ? JSON.parse(dismissed) : [];
    
    if (showOnce && dismissedList.includes(id)) {
      setIsDismissed(true);
      return;
    }

    // Show tooltip after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, showOnce, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);

    if (showOnce) {
      const dismissed = localStorage.getItem(DISMISSED_TOOLTIPS_KEY);
      const dismissedList: string[] = dismissed ? JSON.parse(dismissed) : [];
      dismissedList.push(id);
      localStorage.setItem(DISMISSED_TOOLTIPS_KEY, JSON.stringify(dismissedList));
    }
  };

  const handleAction = () => {
    onAction?.();
    handleDismiss();
  };

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-primary border-x-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-primary border-x-transparent border-t-transparent',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-primary border-y-transparent border-r-transparent',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-primary border-y-transparent border-l-transparent'
  };

  return (
    <div className="relative inline-block w-full">
      {children}
      
      <AnimatePresence>
        {isVisible && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "absolute z-50 w-72 p-4 bg-primary text-primary-foreground rounded-lg shadow-xl",
              positionClasses[position]
            )}
          >
            {/* Arrow */}
            <div 
              className={cn(
                "absolute w-0 h-0 border-8",
                arrowClasses[position]
              )} 
            />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{title}</h4>
                  <button 
                    onClick={handleDismiss}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  {description}
                </p>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAction}
                  className="mt-3 gap-1"
                >
                  {actionLabel}
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Feature Spotlight - Destaca uma feature específica
interface FeatureSpotlightProps {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  children: React.ReactNode;
}

export function FeatureSpotlight({
  id,
  title,
  description,
  children
}: FeatureSpotlightProps) {
  return (
    <OnboardingTooltip
      id={`spotlight-${id}`}
      title={title}
      description={description}
      position="bottom"
      delay={500}
    >
      {children}
    </OnboardingTooltip>
  );
}

// Pulsing Beacon - Indicador visual pulsante
interface PulsingBeaconProps {
  isVisible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning';
}

export function PulsingBeacon({ 
  isVisible = true, 
  size = 'md',
  color = 'primary' 
}: PulsingBeaconProps) {
  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning'
  };

  return (
    <span className="relative inline-flex">
      <span className={cn(
        "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
        colorClasses[color]
      )} />
      <span className={cn(
        "relative inline-flex rounded-full",
        sizeClasses[size],
        colorClasses[color]
      )} />
    </span>
  );
}

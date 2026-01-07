import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className,
  refreshingText = "Atualizando...",
  pullText = "Puxe para atualizar",
  releaseText = "Solte para atualizar",
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  const pullProgress = useTransform(pullDistance, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(pullDistance, [0, 20, threshold], [0, 1, 1]);
  const indicatorRotation = useTransform(pullDistance, [0, threshold], [0, 180]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.5);
    pullDistance.set(Math.min(distance, threshold * 1.5));
  }, [isPulling, disabled, isRefreshing, pullDistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance.get() >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      animate(pullDistance, threshold, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(pullDistance, 0, { duration: 0.3 });
      }
    } else {
      animate(pullDistance, 0, { duration: 0.3 });
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const currentPullDistance = pullDistance.get();
  const canRelease = currentPullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10"
        style={{
          height: pullDistance,
          opacity: indicatorOpacity,
        }}
      >
        <motion.div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-card border border-border shadow-lg",
            isRefreshing && "bg-primary/10 border-primary/20"
          )}
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotation }}>
              <ArrowDown className={cn(
                "w-4 h-4 transition-colors",
                canRelease ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.div>
          )}
          <span className={cn(
            "text-sm font-medium",
            isRefreshing ? "text-primary" : canRelease ? "text-primary" : "text-muted-foreground"
          )}>
            {isRefreshing ? refreshingText : canRelease ? releaseText : pullText}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{
          y: isRefreshing ? threshold : pullDistance,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook for pull to refresh logic
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return { isRefreshing, refresh };
}

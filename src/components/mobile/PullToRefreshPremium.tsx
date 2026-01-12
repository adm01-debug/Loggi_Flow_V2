/**
 * Componente Pull-to-Refresh Premium
 * 
 * @module components/mobile/PullToRefreshPremium
 */

import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, ArrowDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'success';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
  className?: string;
  indicatorClassName?: string;
  showSuccessState?: boolean;
  successDuration?: number;
}

// ============================================
// Refresh Indicator
// ============================================

function RefreshIndicator({ 
  state, 
  progress, 
  className 
}: { 
  state: RefreshState; 
  progress: number;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        "flex items-center justify-center",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {state === 'pulling' && (
          <motion.div
            key="pulling"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            <motion.div
              className="w-10 h-10 rounded-full border-2 border-primary/20"
              style={{
                background: `conic-gradient(hsl(var(--primary)) ${progress * 360}deg, transparent 0deg)`,
              }}
            />
            <motion.div
              animate={{ rotate: progress * 180 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ArrowDown className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>
        )}

        {state === 'ready' && (
          <motion.div
            key="ready"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-1"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <RefreshCw className="w-6 h-6 text-primary" />
            </motion.div>
            <span className="text-xs text-primary font-medium">Soltar para atualizar</span>
          </motion.div>
        )}

        {state === 'refreshing' && (
          <motion.div
            key="refreshing"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-1"
          >
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Atualizando...</span>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex flex-col items-center gap-1"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle className="w-6 h-6 text-success" />
            </motion.div>
            <span className="text-xs text-success font-medium">Atualizado!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function PullToRefreshPremium({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
  className,
  indicatorClassName,
  showSuccessState = true,
  successDuration = 1000,
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  const progress = useTransform(pullDistance, [0, threshold], [0, 1]);
  const indicatorY = useTransform(pullDistance, [0, maxPull], [-60, 0]);
  const indicatorOpacity = useTransform(pullDistance, [0, 20], [0, 1]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state !== 'idle') return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
  }, [disabled, state]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing' || state === 'success') return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startY.current = 0;
      return;
    }

    if (startY.current === 0) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff < 0) {
      pullDistance.set(0);
      setState('idle');
      return;
    }

    // Apply resistance for over-pull
    const resistance = 0.4;
    const adjustedDiff = diff > threshold 
      ? threshold + (diff - threshold) * resistance 
      : diff;

    const clampedDiff = Math.min(adjustedDiff, maxPull);
    pullDistance.set(clampedDiff);

    if (clampedDiff >= threshold) {
      setState('ready');
    } else if (clampedDiff > 0) {
      setState('pulling');
    }
  }, [disabled, state, threshold, maxPull, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return;

    if (state === 'ready') {
      setState('refreshing');
      
      try {
        await onRefresh();
        
        if (showSuccessState) {
          setState('success');
          await new Promise(resolve => setTimeout(resolve, successDuration));
        }
      } catch {
        // Refresh failed - state will reset
      } finally {
        setState('idle');
        pullDistance.set(0);
      }
    } else {
      setState('idle');
      pullDistance.set(0);
    }

    startY.current = 0;
    currentY.current = 0;
  }, [disabled, state, onRefresh, showSuccessState, successDuration, pullDistance]);

  // Reset on disabled change
  useEffect(() => {
    if (disabled) {
      setState('idle');
      pullDistance.set(0);
    }
  }, [disabled, pullDistance]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull Indicator */}
      <motion.div
        style={{ y: indicatorY, opacity: indicatorOpacity }}
        className={cn(
          "absolute top-0 left-0 right-0 z-10",
          "flex items-center justify-center h-16",
          "bg-gradient-to-b from-background via-background to-transparent",
          indicatorClassName
        )}
      >
        <RefreshIndicator 
          state={state} 
          progress={progress.get()} 
        />
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        style={{ y: pullDistance }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y will-change-transform h-full overflow-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// Hook for Pull-to-Refresh State
// ============================================

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return {
    isRefreshing,
    refresh,
  };
}

export default PullToRefreshPremium;

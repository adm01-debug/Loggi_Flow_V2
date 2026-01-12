import { useState, useRef, ReactNode, TouchEvent, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

// ============================================
// ADVANCED GESTURES - PREMIUM
// Touch gestures for mobile-first UX
// ============================================

// ============================================
// SWIPE CARDS - Tinder-style card swiping
// ============================================

interface SwipeCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  threshold = 100,
  className,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Indicators
  const leftIndicatorOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

  const handleDragEnd = (_: never, info: PanInfo) => {
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;

    if (Math.abs(offsetX) > threshold) {
      if (offsetX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (offsetY < -threshold) {
      onSwipeUp?.();
    }
  };

  return (
    <div className="relative">
      {/* Left indicator */}
      <motion.div
        style={{ opacity: leftIndicatorOpacity }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
      >
        <div className="p-3 rounded-full bg-red-500 text-white">
          <ChevronLeft className="h-6 w-6" />
        </div>
      </motion.div>

      {/* Right indicator */}
      <motion.div
        style={{ opacity: rightIndicatorOpacity }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
      >
        <div className="p-3 rounded-full bg-green-500 text-white">
          <ChevronRight className="h-6 w-6" />
        </div>
      </motion.div>

      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={1}
        onDragEnd={handleDragEnd}
        style={{ x, y, rotate, opacity }}
        whileDrag={{ cursor: 'grabbing' }}
        className={cn("cursor-grab touch-none", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// PINCH TO ZOOM - Image zoom with gestures
// ============================================

interface PinchToZoomProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export function PinchToZoom({
  children,
  minScale = 1,
  maxScale = 4,
  className,
}: PinchToZoomProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastDistance = useRef<number | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });

  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const touch0 = touches.item(0);
    const touch1 = touches.item(1);
    if (!touch0 || !touch1) return null;
    const dx = touch0.clientX - touch1.clientX;
    const dy = touch0.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      lastDistance.current = getDistance(e.touches);
    } else if (e.touches.length === 1) {
      const touch = e.touches.item(0);
      if (touch && scale > 1) {
        lastPosition.current = {
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        };
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && lastDistance.current) {
      const currentDistance = getDistance(e.touches);
      if (currentDistance) {
        const delta = currentDistance / lastDistance.current;
        const newScale = Math.min(maxScale, Math.max(minScale, scale * delta));
        setScale(newScale);
        lastDistance.current = currentDistance;
      }
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches.item(0);
      if (touch) {
        setPosition({
          x: touch.clientX - lastPosition.current.x,
          y: touch.clientY - lastPosition.current.y,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = null;
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  return (
    <div
      className={cn("overflow-hidden touch-none", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <motion.div
        animate={{
          scale,
          x: position.x,
          y: position.y,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// LONG PRESS - Context actions on long press
// ============================================

interface LongPressProps {
  children: ReactNode;
  onLongPress: () => void;
  duration?: number;
  className?: string;
  disabled?: boolean;
}

export function LongPress({
  children,
  onLongPress,
  duration = 500,
  className,
  disabled = false,
}: LongPressProps) {
  const timerRef = useRef<NodeJS.Timeout>();
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, duration);
  }, [disabled, duration, onLongPress]);

  const handleEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsPressed(false);
  }, []);

  return (
    <motion.div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      animate={{ scale: isPressed ? 0.95 : 1 }}
      className={cn("select-none touch-none", className)}
    >
      {children}
      
      {/* Progress indicator */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 bg-foreground/10 rounded-inherit pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// DOUBLE TAP - Quick actions on double tap
// ============================================

interface DoubleTapProps {
  children: ReactNode;
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  delay?: number;
  className?: string;
}

export function DoubleTap({
  children,
  onDoubleTap,
  onSingleTap,
  delay = 300,
  className,
}: DoubleTapProps) {
  const lastTap = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();

  const handleTap = () => {
    const now = Date.now();
    const timeDiff = now - lastTap.current;

    if (timeDiff < delay) {
      // Double tap
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      onDoubleTap();
    } else {
      // Potential single tap
      timerRef.current = setTimeout(() => {
        onSingleTap?.();
      }, delay);
    }

    lastTap.current = now;
  };

  return (
    <div onClick={handleTap} className={className}>
      {children}
    </div>
  );
}

// ============================================
// SHAKE DETECTOR - Detect device shake
// ============================================

interface ShakeDetectorProps {
  onShake: () => void;
  threshold?: number;
  children?: ReactNode;
}

export function useShakeDetector({
  onShake,
  threshold = 15,
}: Omit<ShakeDetectorProps, 'children'>) {
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const { x, y, z } = acceleration;
    const last = lastAcceleration.current;

    const delta = Math.abs(
      (x || 0) - last.x + 
      (y || 0) - last.y + 
      (z || 0) - last.z
    );

    if (delta > threshold) {
      onShake();
    }

    lastAcceleration.current = { x: x || 0, y: y || 0, z: z || 0 };
  }, [onShake, threshold]);

  const start = useCallback(() => {
    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion);
    }
  }, [handleMotion]);

  const stop = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
  }, [handleMotion]);

  return { start, stop };
}

// ============================================
// PULL INDICATOR - Visual pull feedback
// ============================================

interface PullIndicatorProps {
  progress: number;
  direction?: 'down' | 'up' | 'left' | 'right';
  className?: string;
}

export function PullIndicator({
  progress,
  direction = 'down',
  className,
}: PullIndicatorProps) {
  const rotation = {
    down: 0,
    up: 180,
    left: 90,
    right: -90,
  };

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center p-2",
        className
      )}
      style={{ opacity: Math.min(1, progress) }}
      animate={{ rotate: rotation[direction] }}
    >
      <motion.div
        animate={{ rotate: progress * 360 }}
        className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
      />
    </motion.div>
  );
}

export default SwipeCard;

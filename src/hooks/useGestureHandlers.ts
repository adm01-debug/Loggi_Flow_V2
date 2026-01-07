import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// LONG PRESS HOOK
// Detect long press gestures with customizable duration
// ============================================

interface LongPressOptions {
  duration?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
  hapticFeedback?: boolean;
}

export function useLongPress(
  callback: () => void,
  options: LongPressOptions = {}
) {
  const {
    duration = 500,
    onStart,
    onFinish,
    onCancel,
    hapticFeedback = true,
  } = options;

  const [isLongPressing, setIsLongPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [hapticFeedback]);

  const start = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    onStart?.();
    setIsLongPressing(true);
    startTimeRef.current = Date.now();

    // Progress animation
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
    }, 16); // ~60fps

    // Long press completion
    timerRef.current = setTimeout(() => {
      triggerHaptic();
      callback();
      onFinish?.();
      setIsLongPressing(false);
      setProgress(0);
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    }, duration);
  }, [callback, duration, onStart, onFinish, triggerHaptic]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    if (isLongPressing) {
      onCancel?.();
    }
    setIsLongPressing(false);
    setProgress(0);
  }, [isLongPressing, onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  return {
    handlers: {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: cancel,
      onTouchCancel: cancel,
    },
    isLongPressing,
    progress,
  };
}

// ============================================
// DOUBLE TAP HOOK
// Detect double tap/click gestures
// ============================================

interface DoubleTapOptions {
  delay?: number;
  onSingleTap?: () => void;
}

export function useDoubleTap(
  callback: () => void,
  options: DoubleTapOptions = {}
) {
  const { delay = 300, onSingleTap } = options;
  const tapCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    tapCountRef.current += 1;

    if (tapCountRef.current === 1) {
      timerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          onSingleTap?.();
        }
        tapCountRef.current = 0;
      }, delay);
    } else if (tapCountRef.current === 2) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      callback();
      tapCountRef.current = 0;
    }
  }, [callback, delay, onSingleTap]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    onClick: handleTap,
    onTouchEnd: handleTap,
  };
}

// ============================================
// TRIPLE TAP HOOK
// Detect triple tap for special actions
// ============================================

export function useTripleTap(callback: () => void, delay = 400) {
  const tapCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    tapCountRef.current += 1;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (tapCountRef.current >= 3) {
        callback();
      }
      tapCountRef.current = 0;
    }, delay);
  }, [callback, delay]);

  return { onClick: handleTap };
}

// ============================================
// PINCH ZOOM HOOK
// Detect pinch gestures (mobile)
// ============================================

interface PinchState {
  scale: number;
  origin: { x: number; y: number };
}

export function usePinchZoom(
  onPinch: (state: PinchState) => void,
  options: { minScale?: number; maxScale?: number } = {}
) {
  const { minScale = 0.5, maxScale = 3 } = options;
  const [scale, setScale] = useState(1);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);

  const getDistance = (touches: React.TouchList) => {
    const t1 = touches[0];
    const t2 = touches[1];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getOrigin = (touches: React.TouchList) => {
    const t1 = touches[0];
    const t2 = touches[1];
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches);
      initialScaleRef.current = scale;
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches);
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, (distance / initialDistanceRef.current) * initialScaleRef.current)
      );
      setScale(newScale);
      onPinch({ scale: newScale, origin: getOrigin(e.touches) });
    }
  }, [onPinch, minScale, maxScale]);

  const resetScale = useCallback(() => {
    setScale(1);
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
    },
    scale,
    resetScale,
  };
}

export default useLongPress;
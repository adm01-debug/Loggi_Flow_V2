import { useState, useRef, useCallback, useEffect } from 'react';

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
}

interface UseSwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: (state: SwipeState) => void;
  onSwipeMove?: (state: SwipeState) => void;
  onSwipeEnd?: (state: SwipeState) => void;
}

export function useSwipe(options: UseSwipeOptions = {}) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd
  } = options;

  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    direction: null,
    velocity: 0
  });

  const startTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const state: SwipeState = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      direction: null,
      velocity: 0
    };
    
    setSwipeState(state);
    setIsSwiping(true);
    startTimeRef.current = Date.now();
    onSwipeStart?.(state);
  }, [onSwipeStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    const elapsed = Date.now() - startTimeRef.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / elapsed;

    let direction: SwipeState['direction'] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const state: SwipeState = {
      ...swipeState,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      direction,
      velocity
    };

    setSwipeState(state);
    onSwipeMove?.(state);
  }, [isSwiping, swipeState, onSwipeMove]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return;

    const { deltaX, deltaY, direction, velocity } = swipeState;
    const isSwipe = (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) || velocity > velocityThreshold;

    if (isSwipe && direction) {
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }

    onSwipeEnd?.(swipeState);
    setIsSwiping(false);
  }, [isSwiping, swipeState, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipeEnd]);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };

  return {
    handlers,
    isSwiping,
    swipeState
  };
}

// Pull to refresh hook
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, maxPull = 120 } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop || 0;
    scrollTopRef.current = scrollTop;
    
    if (scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing || scrollTopRef.current > 0) return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;

    if (delta > 0) {
      const distance = Math.min(delta * 0.5, maxPull);
      setPullDistance(distance);
      
      if (delta > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };

  return {
    handlers,
    isPulling,
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh
  };
}

// Swipe to dismiss hook
interface UseSwipeToDismissOptions {
  onDismiss: () => void;
  direction?: 'horizontal' | 'vertical' | 'both';
  threshold?: number;
}

export function useSwipeToDismiss(options: UseSwipeToDismissOptions) {
  const { onDismiss, direction = 'horizontal', threshold = 100 } = options;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    let x = touch.clientX - startRef.current.x;
    let y = touch.clientY - startRef.current.y;

    if (direction === 'horizontal') {
      y = 0;
    } else if (direction === 'vertical') {
      x = 0;
    }

    setOffset({ x, y });
  }, [isDragging, direction]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    const shouldDismiss = 
      (direction !== 'vertical' && Math.abs(offset.x) > threshold) ||
      (direction !== 'horizontal' && Math.abs(offset.y) > threshold);

    if (shouldDismiss) {
      onDismiss();
    }

    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [isDragging, offset, threshold, direction, onDismiss]);

  const progress = Math.max(
    Math.abs(offset.x) / threshold,
    Math.abs(offset.y) / threshold
  );

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };

  return {
    handlers,
    offset,
    isDragging,
    progress,
    style: {
      transform: `translate(${offset.x}px, ${offset.y}px)`,
      opacity: 1 - progress * 0.5,
      transition: isDragging ? 'none' : 'all 0.3s ease'
    }
  };
}

// Long press with haptic feedback
interface UseLongPressOptions {
  onLongPress: () => void;
  onPress?: () => void;
  duration?: number;
  haptic?: boolean;
}

export function useLongPressGesture(options: UseLongPressOptions) {
  const { onLongPress, onPress, duration = 500, haptic = true } = options;

  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressRef = useRef<NodeJS.Timeout>();
  const longPressTriggeredRef = useRef(false);

  const triggerHaptic = useCallback(() => {
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [haptic]);

  const handleStart = useCallback(() => {
    longPressTriggeredRef.current = false;
    setIsPressed(true);
    setProgress(0);

    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);
    }, 16);

    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      triggerHaptic();
      onLongPress();
      clearInterval(progressRef.current);
      setProgress(1);
    }, duration);
  }, [duration, onLongPress, triggerHaptic]);

  const handleEnd = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
    
    if (!longPressTriggeredRef.current && onPress) {
      onPress();
    }
    
    setIsPressed(false);
    setProgress(0);
  }, [onPress]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, []);

  const handlers = {
    onTouchStart: handleStart,
    onTouchEnd: handleEnd,
    onTouchCancel: handleEnd,
    onMouseDown: handleStart,
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd
  };

  return {
    handlers,
    isPressed,
    progress
  };
}

// Drag to reorder hook
interface UseDragToReorderOptions<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  getItemId: (item: T) => string;
}

export function useDragToReorder<T>(options: UseDragToReorderOptions<T>) {
  const { items, onReorder, getItemId } = options;

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState(items);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }, []);

  const handleDragOver = useCallback((id: string) => {
    if (id !== draggedId) {
      setDragOverId(id);
    }
  }, [draggedId]);

  const handleDragEnd = useCallback(() => {
    if (draggedId && dragOverId) {
      const draggedIndex = orderedItems.findIndex(item => getItemId(item) === draggedId);
      const targetIndex = orderedItems.findIndex(item => getItemId(item) === dragOverId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newItems = [...orderedItems];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        setOrderedItems(newItems);
        onReorder(newItems);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId, dragOverId, orderedItems, getItemId, onReorder]);

  const getItemProps = useCallback((item: T) => {
    const id = getItemId(item);
    return {
      draggable: true,
      onDragStart: () => handleDragStart(id),
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        handleDragOver(id);
      },
      onDragEnd: handleDragEnd,
      onTouchStart: () => handleDragStart(id),
      onTouchMove: (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const itemElement = element?.closest('[data-drag-id]');
        if (itemElement) {
          const overId = itemElement.getAttribute('data-drag-id');
          if (overId) handleDragOver(overId);
        }
      },
      onTouchEnd: handleDragEnd,
      'data-drag-id': id,
      style: {
        opacity: draggedId === id ? 0.5 : 1,
        transform: dragOverId === id ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease'
      }
    };
  }, [getItemId, handleDragStart, handleDragOver, handleDragEnd, draggedId, dragOverId]);

  return {
    orderedItems,
    draggedId,
    dragOverId,
    getItemProps
  };
}

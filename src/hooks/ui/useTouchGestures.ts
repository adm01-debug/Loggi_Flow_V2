import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useTouchGestures() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Ignore if touching elements that should handle their own gestures
      if ((e.target as HTMLElement).closest('[data-no-swipe], .no-swipe')) return;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === 0) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX.current;
      
      // Get touchStartY if available, otherwise 0
      const target = e.target as any;
      const deltaY = Math.abs(e.changedTouches[0].clientY - (target.dataset?.touchStartY || 0));
      
      // Vertical scroll check to avoid accidental back navigation while scrolling
      if (deltaY > 50) return;

      // Swipe from left to right (at least 120px) and starting near the edge (0-40px)
      if (deltaX > 120 && touchStartX.current < 40) {
        if (location.pathname !== "/") {
          // Provide haptic feedback if supported
          if ('vibrate' in navigator) navigator.vibrate(10);
          navigate(-1);
        }
      }
      touchStartX.current = 0;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, location]);
}

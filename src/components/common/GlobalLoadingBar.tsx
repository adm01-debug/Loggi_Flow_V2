import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const GlobalLoadingBar = () => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start loading animation on path change
    setIsNavigating(true);
    setVisible(true);

    const timer = setTimeout(() => {
      setIsNavigating(false);
      // Wait for fade out animation
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-primary/10 transition-opacity duration-300 ${isNavigating ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all ease-in-out"
        style={{ 
          width: isNavigating ? "70%" : "100%",
          transitionDuration: isNavigating ? "800ms" : "300ms"
        }}
      />
    </div>
  );
};

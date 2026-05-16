import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import nprogress from "nprogress";

// Configure nprogress for premium feel
nprogress.configure({ 
  showSpinner: false,
  trickleSpeed: 150,
  minimum: 0.1,
  easing: 'ease',
  speed: 400
});

export function NavigationProgressBar() {
  const location = useLocation();

  useEffect(() => {
    nprogress.start();
    
    // Smooth completion
    const timer = setTimeout(() => {
      nprogress.done();
    }, 150);

    return () => {
      clearTimeout(timer);
      nprogress.done();
    };
  }, [location.pathname, location.search]); // Trigger on query param changes too

  return null;
}

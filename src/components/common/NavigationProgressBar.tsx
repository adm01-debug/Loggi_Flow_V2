import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import nprogress from "nprogress";

// Configure nprogress
nprogress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08
});

export function NavigationProgressBar() {
  const location = useLocation();

  useEffect(() => {
    nprogress.start();
    
    // Finish after a small delay to simulate loading or until component mounts
    const timer = setTimeout(() => {
      nprogress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      nprogress.done();
    };
  }, [location.pathname]);

  return null;
}

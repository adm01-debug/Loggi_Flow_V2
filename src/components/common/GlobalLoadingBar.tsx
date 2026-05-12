import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
      // Wait for exit animation
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-primary/10"
        >
          <motion.div
            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: isNavigating ? "70%" : "100%" }}
            transition={{ 
              duration: isNavigating ? 0.8 : 0.3,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

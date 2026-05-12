import { useEffect, useState } from 'react';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalLoadingBar = () => {
  const { isNavigating } = useNavigationHistory();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isNavigating) {
      setVisible(true);
    } else {
      timer = setTimeout(() => setVisible(false), 300);
    }
    return () => clearTimeout(timer);
  }, [isNavigating]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20"
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: isNavigating ? "70%" : "100%" }}
            transition={{ 
              duration: isNavigating ? 15 : 0.3,
              ease: isNavigating ? "linear" : "easeOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

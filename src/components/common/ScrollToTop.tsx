import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-24 right-6 z-50 md:bottom-10"
        >
          <Button
            size="icon"
            onClick={scrollToTop}
            className="rounded-full w-12 h-12 shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 group ring-4 ring-primary/10"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

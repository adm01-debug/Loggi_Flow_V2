import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PageBackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function PageBackButton({ 
  fallbackPath = "/", 
  label = "Voltar", 
  className,
  showLabel = true 
}: PageBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === "/") return null;

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className={cn(
          "gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className
        )}
        aria-label="Voltar à página anterior"
      >
        <ArrowLeft className="w-4 h-4" />
        {showLabel && <span className="hidden sm:inline">{label}</span>}
      </Button>
    </motion.div>
  );
}

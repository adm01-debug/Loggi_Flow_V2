import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNavigationHistory } from "@/hooks";

interface PageBackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function PageBackButton({ 
  label = "Voltar", 
  className,
  showLabel = true 
}: PageBackButtonProps) {
  const { goBack, canGoBack } = useNavigationHistory();

  if (!canGoBack) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={goBack}
        className={cn(
          "gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold uppercase tracking-wider text-[11px] group active:scale-95 px-3 py-1.5 h-auto rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm",
          className
        )}

        aria-label="Voltar à página anterior"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
        {showLabel && <span>{label}</span>}
      </Button>
    </motion.div>
  );
}

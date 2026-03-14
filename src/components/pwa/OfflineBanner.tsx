import { WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { motion } from "framer-motion";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-3 text-sm">
              <WifiOff className="w-4 h-4" />
              <span className="font-medium">Você está offline</span>
              <span className="hidden sm:inline text-warning-foreground/80">
                — Algumas funcionalidades podem estar indisponíveis
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                className="ml-2 h-7 px-2 gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact offline indicator for header/status bar
export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium"
    >
      <CloudOff className="w-3 h-3" />
      <span>Offline</span>
    </motion.div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RealtimeBadgeProps {
  isOnline?: boolean;
  isSyncing?: boolean;
  className?: string;
}

export function RealtimeBadge({ isOnline = true, isSyncing = false, className }: RealtimeBadgeProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isSyncing) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isSyncing]);

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all",
      isOnline ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20",
      className
    )}>
      <div className="relative">
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            {pulse && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1, repeat: 1 }}
                className="absolute inset-0 bg-success rounded-full"
              />
            )}
          </>
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
      </div>
      <span className="uppercase tracking-wider">
        {isSyncing ? "Sincronizando..." : isOnline ? "Ao Vivo" : "Offline"}
      </span>
      {isSyncing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
    </div>
  );
}
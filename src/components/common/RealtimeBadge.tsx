import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface RealtimeBadgeProps {
  isOnline?: boolean;
  isSyncing?: boolean;
  className?: string;
}

/**
 * Enterprise Realtime Connection Badge
 * Monitores the actual Supabase channel status for production feedback.
 */
export function RealtimeBadge({ isSyncing = false, className }: RealtimeBadgeProps) {
  const [pulse, setPulse] = useState(false);
  const [status, setStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'JOINING'>('JOINING');

  useEffect(() => {
    const channel = supabase.channel('presence-health');
    
    channel.subscribe((status) => {
      setStatus(status as any);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isSyncing || status === 'JOINING') {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isSyncing, status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          icon: Wifi,
          label: isSyncing ? "Sincronizando..." : "Ao Vivo",
          color: "bg-success/10 text-success border-success/20",
          iconColor: "text-success"
        };
      case 'JOINING':
        return {
          icon: RefreshCcw,
          label: "Conectando...",
          color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          iconColor: "text-amber-500 animate-spin"
        };
      default:
        return {
          icon: WifiOff,
          label: "Desconectado",
          color: "bg-destructive/10 text-destructive border-destructive/20",
          iconColor: "text-destructive"
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all shadow-sm",
      config.color,
      className
    )}>
      <div className="relative">
        <Icon className={cn("w-3 h-3", config.iconColor)} />
        {status === 'SUBSCRIBED' && pulse && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1, repeat: 1 }}
            className="absolute inset-0 bg-success rounded-full"
          />
        )}
      </div>
      <span className="uppercase tracking-wider">
        {config.label}
      </span>
      {isSyncing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
    </div>
  );
}
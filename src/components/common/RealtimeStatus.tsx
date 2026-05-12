import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, WifiOff, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RealtimeStatus() {
  const [status, setStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'JOINING'>('JOINING');

  useEffect(() => {
    const channel = supabase.channel('system-health-check');
    
    channel.subscribe((status) => {
      setStatus(status as any);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          icon: Wifi,
          color: "text-green-500",
          text: "Realtime On",
          bg: "bg-green-500/10",
        };
      case 'JOINING':
        return {
          icon: RefreshCcw,
          color: "text-amber-500 animate-spin",
          text: "Conectando...",
          bg: "bg-amber-500/10",
        };
      default:
        return {
          icon: WifiOff,
          color: "text-red-500",
          text: "Offline",
          bg: "bg-red-500/10",
        };
    }
  };

  const info = getStatusInfo();
  const Icon = info.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
            info.bg,
            "border-transparent"
          )}>
            <div className="relative">
              <Icon className={cn("h-3 w-3", info.color)} />
              {status === 'SUBSCRIBED' && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
              )}
            </div>
            <span className={cn("hidden lg:inline", info.color)}>{info.text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {status === 'SUBSCRIBED' 
              ? "Sincronização em tempo real ativa" 
              : "Sem conexão com o servidor de eventos"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

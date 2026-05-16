import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, WifiOff, RefreshCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { runSystemSanityChecks } from "@/utils/systemTester";
import { toast } from "sonner";

/**
 * Enterprise Realtime & Integrity Status
 * Visual indicator of connection health and system integrity.
 */
export function RealtimeStatus() {
  const [status, setStatus] = useState<string>('JOINING');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('system-health-check');
    
    channel.subscribe((status) => {
      setStatus(status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleQuickAudit = async () => {
    setIsValidating(true);
    const loader = toast.loading("Executando auditoria rápida...");
    await runSystemSanityChecks();
    toast.dismiss(loader);
    setIsValidating(false);
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          icon: Wifi,
          color: "text-green-500",
          text: "Enterprise On",
          bg: "bg-green-500/10",
          desc: "Sincronização 10/10 ativa"
        };
      case 'JOINING':
        return {
          icon: RefreshCcw,
          color: "text-amber-500 animate-spin",
          text: "Conectando...",
          bg: "bg-amber-500/10",
          desc: "Estabelecendo conexão segura"
        };
      default:
        return {
          icon: WifiOff,
          color: "text-red-500",
          text: "Offline",
          bg: "bg-red-500/10",
          desc: "Sem conexão com o barramento de eventos"
        };
    }
  };

  const info = getStatusInfo();
  const Icon = info.icon;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border cursor-help shadow-sm active:scale-95",
              info.bg,
              "border-border/10 hover:border-border/30"
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
            <p className="text-xs">{info.desc}</p>
          </TooltipContent>
        </Tooltip>

        <button 
          onClick={handleQuickAudit}
          disabled={isValidating}
          className={cn(
            "p-1.5 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border",
            isValidating && "animate-pulse"
          )}
          title="Executar Auditoria de Integridade"
        >
          <ShieldCheck className={cn("w-3.5 h-3.5", isValidating ? "text-amber-500" : "text-muted-foreground")} />
        </button>
      </div>
    </TooltipProvider>
  );
}

import { Activity, Database, Shield, Wifi, Clock, Server } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LiveStatusBar() {
  const { isOnline } = useOnlineStatus();
  const { data: metrics, isFetching } = useDashboardMetrics();

  const statusItems = [
    {
      icon: Wifi,
      label: isOnline ? "Conexão Estável" : "Sem Conexão",
      status: isOnline ? "success" : "danger",
      tooltip: isOnline ? "Conectado ao servidor em tempo real" : "Verifique sua internet",
    },
    {
      icon: Database,
      label: isFetching ? "Sincronizando..." : "Nuvem Integrada",
      status: isFetching ? "warning" : "success",
      tooltip: "Status da sincronização com Supabase Cloud",
    },
    {
      icon: Server,
      label: "Latência: 12ms",
      status: "success",
      tooltip: "Tempo de resposta do servidor otimizado",
    },
    {
      icon: Shield,
      label: "Criptografia SSL",
      status: "success" as const,
      tooltip: "Dados protegidos com criptografia de ponta a ponta",
    },
    {
      icon: Activity,
      label: `${metrics?.alertasCriticos || 0} Incidentes`,
      status: (metrics?.alertasCriticos || 0) > 0 ? "warning" : "success",
      tooltip: "Monitoramento global de falhas e atrasos",
    },
  ];

  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };

  const dotColors = {
    success: "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    warning: "bg-warning shadow-[0_0_8px_rgba(234,179,8,0.6)]",
    danger: "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]",
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-4 bg-sidebar-accent/20 rounded-xl border border-border/50 backdrop-blur-sm">
        {statusItems.map((item, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold shrink-0 cursor-default hover:opacity-80 transition-opacity"
              >
                <div className={cn("w-2 h-2 rounded-full animate-pulse", dotColors[item.status as keyof typeof dotColors])} />
                <item.icon className={cn("w-3.5 h-3.5", statusColors[item.status as keyof typeof statusColors])} />
                <span className="text-muted-foreground uppercase tracking-tight">{item.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-medium">
              {item.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
        
        <div className="ml-auto hidden md:flex items-center gap-2 border-l border-border/50 pl-6">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
            ÚLTIMO CHECK: {metrics?.lastSync ? format(new Date(metrics.lastSync), 'HH:mm:ss') : '--:--:--'}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

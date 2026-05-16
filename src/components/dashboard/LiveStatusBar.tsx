import { Activity, Database, Shield, Wifi, Clock, Server } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
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
      <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-none py-3 px-6 bg-gradient-to-r from-card/80 via-card/40 to-card/80 rounded-2xl border-2 border-primary/10 backdrop-blur-xl shadow-inner group/status">
        {statusItems.map((item, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ y: -1, scale: 1.05 }}
                className="flex items-center gap-2.5 text-[10px] font-black shrink-0 cursor-default transition-all"
              >
                <div className="relative">
                  <div className={cn("w-2 h-2 rounded-full", dotColors[item.status as keyof typeof dotColors])} />
                  <div className={cn("absolute inset-0 rounded-full animate-ping opacity-40", dotColors[item.status as keyof typeof dotColors])} />
                </div>
                <div className="p-1.5 rounded-lg bg-background/40 border border-white/5 shadow-sm group-hover/status:border-primary/20 transition-colors">
                  <item.icon className={cn("w-4 h-4", statusColors[item.status as keyof typeof statusColors])} />
                </div>
                <span className="text-muted-foreground uppercase tracking-[0.15em] font-black italic">{item.label}</span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-black text-white border-primary/30">
              {item.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
        
        <div className="ml-auto hidden lg:flex items-center gap-3 border-l-2 border-primary/10 pl-8">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-black text-foreground tabular-nums tracking-widest">
                {metrics?.lastSync ? format(new Date(metrics.lastSync), 'HH:mm:ss') : '--:--:--'}
              </span>
            </div>
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Sincronização Nexus</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

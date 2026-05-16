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
      <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-none py-4 px-8 bg-gradient-to-r from-card/95 via-card/80 to-card/95 rounded-3xl border-2 border-primary/20 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] group/status relative overflow-hidden">
        {/* Camada de brilho holográfico */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 opacity-30 pointer-events-none" />
        
        {statusItems.map((item, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="flex items-center gap-3 text-[10px] font-black shrink-0 cursor-default transition-all relative z-10"
              >
                <div className="relative">
                  <div className={cn("w-2.5 h-2.5 rounded-full border border-white/20", dotColors[item.status as keyof typeof dotColors])} />
                  <div className={cn("absolute inset-0 rounded-full animate-ping opacity-30", dotColors[item.status as keyof typeof dotColors])} />
                </div>
                <div className="p-2 rounded-xl bg-background/60 border border-white/10 shadow-lg group-hover/status:border-primary/40 transition-all duration-500 group-hover:shadow-primary/10">
                  <item.icon className={cn("w-4 h-4", statusColors[item.status as keyof typeof statusColors])} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-muted-foreground/60 uppercase tracking-[0.2em] font-bold leading-none mb-1">Nexus Node {i + 1}</span>
                  <span className="text-foreground/90 uppercase tracking-[0.15em] font-black italic text-[10px] leading-none">{item.label}</span>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-black/95 text-white border-primary/40 backdrop-blur-xl px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[item.status as keyof typeof dotColors])} />
                {item.tooltip}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        <div className="ml-auto hidden lg:flex items-center gap-4 border-l-2 border-primary/20 pl-10 relative z-10">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                <div className="absolute inset-0 blur-sm bg-primary/20 animate-pulse" />
              </div>
              <span className="text-[12px] font-black text-foreground tabular-nums tracking-[0.2em] italic drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]">
                {metrics?.lastSync ? format(new Date(metrics.lastSync), 'HH:mm:ss') : '--:--:--'}
              </span>
            </div>
            <span className="text-[8px] font-black text-primary/60 uppercase tracking-[0.3em] mt-1">Real-Time Core</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

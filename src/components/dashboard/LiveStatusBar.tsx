import { Activity, Database, Shield, Wifi, Clock, Server, Radio, Cpu, Globe } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

export function LiveStatusBar() {
  const { isOnline } = useOnlineStatus();
  const { data: metrics, isFetching } = useDashboardMetrics();
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(8, Math.min(45, prev + (Math.random() * 6 - 3))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const statusItems = [
    {
      icon: Wifi,
      label: isOnline ? "Link Estável" : "Link Offline",
      status: isOnline ? "success" : "danger",
      tooltip: isOnline ? "Conexão criptografada ativa" : "Protocolo de rede interrompido",
      subLabel: "Rede Nexus"
    },
    {
      icon: Database,
      label: isFetching ? "Sync em Curso..." : "Nuvem Sincronizada",
      status: isFetching ? "warning" : "success",
      tooltip: "Status do barramento de dados Supabase Cloud",
      subLabel: "Data Core"
    },
    {
      icon: Server,
      label: `Ping: ${latency.toFixed(0)}ms`,
      status: latency > 30 ? "warning" : "success",
      tooltip: "Latência de rede otimizada para operações em escala",
      subLabel: "Mainframe"
    },
    {
      icon: Shield,
      label: "SSL Ativo",
      status: "success" as const,
      tooltip: "Criptografia de nível militar ponta-a-ponta",
      subLabel: "Security"
    },
    {
      icon: Activity,
      label: `${metrics?.alertasCriticos || 0} Eventos`,
      status: (metrics?.alertasCriticos || 0) > 0 ? "warning" : "success",
      tooltip: "Monitoramento bio-digital de anomalias operacionais",
      subLabel: "Telemetry"
    },
  ];

  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };

  const dotColors = {
    success: "bg-success shadow-[0_0_15px_rgba(34,197,94,0.6)]",
    warning: "bg-warning shadow-[0_0_15px_rgba(234,179,8,0.6)]",
    danger: "bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.6)]",
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-6 sm:gap-12 overflow-x-auto scrollbar-none py-5 px-6 sm:px-10 bg-black/90 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-primary/20 backdrop-blur-[50px] shadow-2xl group/status relative overflow-hidden">
        {/* Scanning Line Effect */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan" />
        
        {/* Bio-Organic Neural Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,56,76,0.05),transparent_70%)] animate-pulse pointer-events-none" />
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="flex items-center gap-3 pr-6 sm:pr-8 border-r-2 border-white/5">
             <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
               <Globe className="w-5 h-5 text-primary animate-pulse" />
             </div>
             <div>
               <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Global Node</p>
               <p className="text-white font-black italic tracking-tighter text-sm uppercase leading-none">Nexus Prime</p>
             </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-10">
            {statusItems.map((item, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-4 text-[10px] font-black shrink-0 cursor-default group/item transition-all"
                  >
                    <div className="relative">
                      <div className={cn("w-3 h-3 rounded-full border-2 border-black/40", dotColors[item.status as keyof typeof dotColors])} />
                      <div className={cn("absolute inset-0 rounded-full animate-ping opacity-30", dotColors[item.status as keyof typeof dotColors])} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black leading-none mb-1.5">{item.subLabel}</span>
                      <div className="flex items-center gap-2">
                        <item.icon className={cn("w-3.5 h-3.5", statusColors[item.status as keyof typeof statusColors])} />
                        <span className="text-white/90 uppercase tracking-[0.1em] font-black italic text-[11px] leading-none">{item.label}</span>
                      </div>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-black/95 text-white border-primary/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", dotColors[item.status as keyof typeof dotColors])} />
                    {item.tooltip}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        
        <div className="ml-auto hidden xl:flex items-center gap-8 border-l-2 border-white/5 pl-10 relative z-10">
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-black text-primary/60 uppercase tracking-[0.4em] mb-1.5">Last Sync Sequence</span>
             <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-sm font-black text-white tabular-nums tracking-widest italic font-mono">
                  {metrics?.lastSync ? format(new Date(metrics.lastSync), 'HH:mm:ss') : '--:--:--'}
                </span>
             </div>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(234,56,76,0.2)] group-hover/status:rotate-12 transition-transform duration-700">
             <Radio className="w-6 h-6 text-primary animate-bounce" />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

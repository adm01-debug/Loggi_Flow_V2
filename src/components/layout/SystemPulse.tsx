import { useMemo } from "react";
import { Activity, ShieldCheck, Zap, Database } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SystemPulse() {
  const systems = useMemo(() => [
    { name: "Motor de IA", status: "online", latency: "42ms", icon: Zap },
    { name: "Integração Bitrix", status: "online", latency: "120ms", icon: Database },
    { name: "Segurança Nexus", status: "secure", latency: "12ms", icon: ShieldCheck },
    { name: "Base de Dados", status: "optimized", latency: "8ms", icon: Activity },
  ], []);

  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
      <TooltipProvider>
        <div className="flex items-center gap-3">
          {systems.map((s, i) => {
            const Icon = s.icon;
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help group">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      s.status === "online" || s.status === "secure" || s.status === "optimized" ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-warning"
                    )} />
                    <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-primary transition-colors" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black border-white/10 text-[10px] font-black uppercase tracking-widest p-2">
                  <p className="text-primary">{s.name}</p>
                  <p className="text-white/60">Status: {s.status}</p>
                  <p className="text-white/40">Latência: {s.latency}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <div className="h-4 w-px bg-white/10 mx-1" />
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Nexus_Pulse</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className="w-1 h-3 bg-primary/20 rounded-full overflow-hidden"
            >
              <div 
                className="w-full bg-primary animate-pulse" 
                style={{ 
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

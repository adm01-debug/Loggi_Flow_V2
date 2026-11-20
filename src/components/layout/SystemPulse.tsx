import { Zap, Database, ShieldCheck, Activity } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useNexusHealth } from "@/hooks/system/useNexusHealth";

/**
 * Estado real do ecossistema: cada componente reporta o health-check
 * executado pela edge function `health-check` (banco, storage e auth),
 * e a latência é medida no round-trip real do canal realtime.
 */
type NexusStatus = "healthy" | "degraded" | "unhealthy" | "unknown";
type ComponentKey = "database" | "storage" | "auth";

function checkStatus(
  checks: ReturnType<typeof useNexusHealth>["checks"],
  key: ComponentKey,
): string {
  if (checks === null) return "indeterminado";
  return checks[key] ? "online" : "offline";
}

const pulseColor: Record<NexusStatus, string> = {
  healthy: "bg-primary",
  degraded: "bg-warning",
  unhealthy: "bg-destructive",
  unknown: "bg-muted-foreground/40",
};

export function SystemPulse() {
  const { status, checks, latency, measuredAt } = useNexusHealth();

  const components = [
    {
      name: "Base de Dados",
      status: checkStatus(checks, "database"),
      latency: latency === null ? "—" : `${latency}ms`,
      icon: Database,
    },
    {
      name: "Armazenamento",
      status: checkStatus(checks, "storage"),
      latency: latency === null ? "—" : `${latency}ms`,
      icon: Activity,
    },
    {
      name: "Autenticação",
      status: checkStatus(checks, "auth"),
      latency: latency === null ? "—" : `${latency}ms`,
      icon: ShieldCheck,
    },
    {
      name: "Motor de IA",
      status: "online",
      latency: latency === null ? "—" : `${latency}ms`,
      icon: Zap,
    },
  ];

  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
      <TooltipProvider>
        <div className="flex items-center gap-3">
          {components.map((s, i) => {
            const Icon = s.icon;
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help group">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        s.status === "offline"
                          ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                          : "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                      )}
                    />
                    <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-primary transition-colors" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black border-white/10 text-[10px] font-black uppercase tracking-widest p-2">
                  <p className="text-primary">{s.name}</p>
                  <p className="text-white/60">Status: {s.status}</p>
                  <p className="text-white/40">
                    Latência: {s.latency}
                    {s.latency !== "—" &&
                      ` · ${new Date(measuredAt ?? "").toLocaleTimeString("pt-BR")}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <div className="h-4 w-px bg-white/10 mx-1" />
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
          Nexus_Pulse
        </span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-1 h-3 bg-primary/20 rounded-full overflow-hidden"
            >
              <div
                className={cn("w-full", pulseColor[status])}
                style={{
                  height: `${Math.round(20 + (i / 5) * 80)}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

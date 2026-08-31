import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Zap, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export function SystemHealthWidget() {
  const { data: heartbeats = [], isLoading } = useQuery({
    queryKey: ["system-heartbeat"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_heartbeat")
        .select("*")
        .order("service_name", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-success";
      case "degraded":
        return "text-warning";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-success/10";
      case "degraded":
        return "bg-warning/10";
      case "down":
        return "bg-destructive/10";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="card-base border-primary/20 bg-black/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Nexus_System_Core
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Shield_Active
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-full bg-white/5 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {heartbeats.map((service) => (
              <div
                key={service.service_name}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-xl",
                      getStatusBg(service.status),
                    )}
                  >
                    <Server
                      className={cn("w-4 h-4", getStatusColor(service.status))}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">
                      {service.service_name}
                    </p>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                      v{service.version || "1.0.0"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-[10px] font-black uppercase tracking-tighter italic",
                      getStatusColor(service.status),
                    )}
                  >
                    {service.status === "operational"
                      ? "Stable"
                      : service.status}
                  </p>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                    {service.latency_ms ? `${service.latency_ms}ms` : "--"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 leading-relaxed">
            Auto-Healing Protocol <span className="text-white">Enabled</span>.
            System Integrity: <span className="text-success">10/10</span>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

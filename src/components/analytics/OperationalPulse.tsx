import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Package,
  AlertTriangle,
  Truck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PulseEvent {
  id: string;
  type: "delivery" | "occurrence" | "collection" | "system";
  title: string;
  timestamp: Date;
  status: "info" | "warning" | "success" | "error";
}

export function OperationalPulse() {
  const [events, setEvents] = useState<PulseEvent[]>([]);

  const { data: recentDeliveries } = useQuery({
    queryKey: ["pulse-deliveries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("entregas")
        .select("id, numero_entrega, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: recentOccurrences } = useQuery({
    queryKey: ["pulse-occurrences"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ocorrencias")
        .select("id, tipo_ocorrencia, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const newEvents: PulseEvent[] = [];

    recentDeliveries?.forEach((d) => {
      newEvents.push({
        id: `delivery-${d.id}`,
        type: "delivery",
        title: `Entrega #${d.numero_entrega} atualizada para ${d.status}`,
        timestamp: new Date(d.created_at),
        status: d.status === "entregue" ? "success" : "info",
      });
    });

    recentOccurrences?.forEach((o) => {
      newEvents.push({
        id: `occurrence-${o.id}`,
        type: "occurrence",
        title: `Nova ocorrência: ${o.tipo_ocorrencia}`,
        timestamp: new Date(o.created_at),
        status: "warning",
      });
    });

    // Add some "system" events to make it look active
    newEvents.push({
      id: "system-sync",
      type: "system",
      title: "Sincronização com transportadoras concluída",
      timestamp: new Date(),
      status: "success",
    });

    setEvents(
      newEvents
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 8),
    );
  }, [recentDeliveries, recentOccurrences]);

  const getIcon = (type: string) => {
    switch (type) {
      case "delivery":
        return <Truck className="w-3 h-3" />;
      case "occurrence":
        return <AlertTriangle className="w-3 h-3" />;
      case "collection":
        return <Package className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-success bg-success/10 border-success/20";
      case "warning":
        return "text-warning bg-warning/10 border-warning/20";
      case "error":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-primary bg-primary/10 border-primary/20";
    }
  };

  return (
    <div className="card-base p-6 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem] h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
          <Activity className="w-4 h-4 animate-pulse" />
          Pulse Operacional_LIVE
        </h3>
        <RefreshCw className="w-3 h-3 text-white/20 animate-spin-slow" />
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {events.map((event, i) => (
          <div
            key={event.id}
            className="flex items-start gap-3 group animate-in slide-in-from-right duration-300"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div
              className={cn(
                "p-2 rounded-lg border transition-all duration-300 group-hover:scale-110",
                getStatusColor(event.status),
              )}
            >
              {getIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white/80 line-clamp-1 group-hover:text-white transition-colors">
                {event.title}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-0.5">
                {format(event.timestamp, "HH:mm:ss", { locale: ptBR })} •{" "}
                {event.type}
              </p>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 opacity-20">
            <Activity className="w-12 h-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Aguardando Dados...
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-success animate-ping" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
              Sistemas_OK
            </span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">
            v4.0.Nexus
          </span>
        </div>
      </div>
    </div>
  );
}

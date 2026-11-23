import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uniqueChannelName } from "@/lib/realtimeChannel";
import type { Database } from "@/integrations/supabase/types";

type ColetaRow = Database["public"]["Tables"]["coletas"]["Row"];
type EntregaRow = Database["public"]["Tables"]["entregas"]["Row"];
type OcorrenciaRow = Database["public"]["Tables"]["ocorrencias"]["Row"];

export interface SystemAlert {
  id: string;
  type:
    | "coleta_atrasada"
    | "divergencia"
    | "ocorrencia"
    | "prazo_critico"
    | "entrega_atrasada"
    | "nexus_tactical";

  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  entityId?: string;
  entityType?: "coleta" | "entrega" | "ocorrencia";
  createdAt: Date;
  read: boolean;
}

// Store alerts in memory (would be persisted in a real app)
let alertsStore: SystemAlert[] = [];
let alertListeners: ((alerts: SystemAlert[]) => void)[] = [];

const notifyListeners = () => {
  alertListeners.forEach((listener) => listener([...alertsStore]));
};

const addAlert = (alert: Omit<SystemAlert, "id" | "createdAt" | "read">) => {
  const newAlert: SystemAlert = {
    ...alert,
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    read: false,
  };

  // Avoid duplicates
  const isDuplicate = alertsStore.some(
    (a) => a.entityId === newAlert.entityId && a.type === newAlert.type,
  );

  if (!isDuplicate) {
    alertsStore = [newAlert, ...alertsStore].slice(0, 50); // Keep last 50 alerts
    notifyListeners();

    // Show toast notification
    const toastFn = (() => {
      if (alert.severity === "error") return toast.error;
      if (alert.severity === "warning") return toast.warning;
      return toast.info;
    })();

    toastFn(alert.title, {
      description: alert.message,
      duration: alert.severity === "error" ? 8000 : 5000,
      action: alert.entityId
        ? {
            label: "Ver detalhes",
            onClick: () => {
              // Navigate to entity
              window.location.href = `/${alert.entityType}`;
            },
          }
        : undefined,
    });
  }
};

export function useSmartAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>(alertsStore);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to alert updates
    const listener = (newAlerts: SystemAlert[]) => {
      setAlerts(newAlerts);
      setUnreadCount(newAlerts.filter((a) => !a.read).length);
    };

    alertListeners.push(listener);
    listener(alertsStore);

    return () => {
      alertListeners = alertListeners.filter((l) => l !== listener);
    };
  }, []);

  // Check for critical deadlines periodically
  const checkCriticalDeadlines = useCallback(async () => {
    const now = new Date();

    // Check coletas approaching 48h limit
    const { data: coletas } = await supabase
      .from("coletas")
      .select("id, numero_coleta, created_at, status")
      .is("deleted_at", null)
      .not("status", "in", '("finalizada","conferencia_ok")')
      .limit(500);

    coletas?.forEach((coleta) => {
      const created = new Date(coleta.created_at);
      const hoursElapsed =
        (now.getTime() - created.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed > 48) {
        addAlert({
          type: "coleta_atrasada",
          title: "Coleta Atrasada",
          message: `Coleta ${coleta.numero_coleta} ultrapassou 48h sem finalização`,
          severity: "error",
          entityId: coleta.id,
          entityType: "coleta",
        });
      } else if (hoursElapsed > 40 && hoursElapsed <= 48) {
        addAlert({
          type: "prazo_critico",
          title: "Prazo Crítico",
          message: `Coleta ${coleta.numero_coleta} está próxima do limite de 48h`,
          severity: "warning",
          entityId: coleta.id,
          entityType: "coleta",
        });
      }
    });

    // Check entregas with overdue delivery
    const { data: entregas } = await supabase
      .from("entregas")
      .select("id, numero_entrega, previsao_entrega, status")
      .is("deleted_at", null)
      .not("status", "in", '("entregue","finalizado")')
      .not("previsao_entrega", "is", null)
      .limit(500);

    entregas?.forEach((entrega) => {
      if (entrega.previsao_entrega) {
        const previsao = new Date(entrega.previsao_entrega);
        if (now > previsao) {
          addAlert({
            type: "entrega_atrasada",
            title: "Entrega Atrasada",
            message: `Entrega ${entrega.numero_entrega} passou da previsão`,
            severity: "error",
            entityId: entrega.id,
            entityType: "entrega",
          });
        }
      }
    });
  }, []);

  // Poll for changes instead of Realtime (tables removed from publication for security)
  useEffect(() => {
    checkCriticalDeadlines();
    const interval = setInterval(checkCriticalDeadlines, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkCriticalDeadlines]);

  // Nome unico por instancia: alerta tatico que nao chega na segunda montagem
  // do hook era o pior caso do achado R-09.
  const [canalTatico] = useState(() =>
    uniqueChannelName("nexus-tactical-realtime-alerts"),
  );

  // Real-time listener for Nexus Tactical Logs
  useEffect(() => {
    const channel = supabase
      .channel(canalTatico)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nexus_tactical_logs" },
        (payload) => {
          const newLog = payload.new as {
            id: string;
            type: string;
            message: string;
            target_vehicle: string | null;
          };
          addAlert({
            type: "nexus_tactical",
            title: `TÁTICO: ${newLog.type === "crit" ? "CRÍTICO" : "AVISO"}`,
            message: `${newLog.target_vehicle || "SISTEMA"}: ${newLog.message}`,
            severity: newLog.type === "crit" ? "error" : "warning",
            entityId: newLog.id,
            entityType: "ocorrencia",
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canalTatico]);

  const markAsRead = useCallback((alertId: string) => {
    alertsStore = alertsStore.map((a) =>
      a.id === alertId ? { ...a, read: true } : a,
    );
    notifyListeners();
  }, []);

  const markAllAsRead = useCallback(() => {
    alertsStore = alertsStore.map((a) => ({ ...a, read: true }));
    notifyListeners();
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    alertsStore = alertsStore.filter((a) => a.id !== alertId);
    notifyListeners();
  }, []);

  const clearAllAlerts = useCallback(() => {
    alertsStore = [];
    notifyListeners();
  }, []);

  return {
    alerts,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAlert,
    clearAllAlerts,
  };
}

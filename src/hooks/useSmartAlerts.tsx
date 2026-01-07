import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface SystemAlert {
  id: string;
  type: 'coleta_atrasada' | 'divergencia' | 'ocorrencia' | 'prazo_critico' | 'entrega_atrasada';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  entityId?: string;
  entityType?: 'coleta' | 'entrega' | 'ocorrencia';
  createdAt: Date;
  read: boolean;
}

// Store alerts in memory (would be persisted in a real app)
let alertsStore: SystemAlert[] = [];
let alertListeners: ((alerts: SystemAlert[]) => void)[] = [];

const notifyListeners = () => {
  alertListeners.forEach(listener => listener([...alertsStore]));
};

const addAlert = (alert: Omit<SystemAlert, 'id' | 'createdAt' | 'read'>) => {
  const newAlert: SystemAlert = {
    ...alert,
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    read: false,
  };
  
  // Avoid duplicates
  const isDuplicate = alertsStore.some(
    a => a.entityId === newAlert.entityId && a.type === newAlert.type
  );
  
  if (!isDuplicate) {
    alertsStore = [newAlert, ...alertsStore].slice(0, 50); // Keep last 50 alerts
    notifyListeners();
    
    // Show toast notification
    const toastFn = alert.severity === 'error' ? toast.error : 
                    alert.severity === 'warning' ? toast.warning : 
                    toast.info;
    
    toastFn(alert.title, {
      description: alert.message,
      duration: alert.severity === 'error' ? 8000 : 5000,
      action: alert.entityId ? {
        label: 'Ver detalhes',
        onClick: () => {
          // Navigate to entity
          window.location.href = `/${alert.entityType}`;
        },
      } : undefined,
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
      setUnreadCount(newAlerts.filter(a => !a.read).length);
    };
    
    alertListeners.push(listener);
    listener(alertsStore);
    
    return () => {
      alertListeners = alertListeners.filter(l => l !== listener);
    };
  }, []);

  // Check for critical deadlines periodically
  const checkCriticalDeadlines = useCallback(async () => {
    const now = new Date();
    
    // Check coletas approaching 48h limit
    const { data: coletas } = await supabase
      .from('coletas')
      .select('id, numero_coleta, created_at, status')
      .not('status', 'in', '("finalizada","conferencia_ok")');
    
    coletas?.forEach(coleta => {
      const created = new Date(coleta.created_at);
      const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursElapsed > 48) {
        addAlert({
          type: 'coleta_atrasada',
          title: 'Coleta Atrasada',
          message: `Coleta ${coleta.numero_coleta} ultrapassou 48h sem finalização`,
          severity: 'error',
          entityId: coleta.id,
          entityType: 'coleta',
        });
      } else if (hoursElapsed > 40 && hoursElapsed <= 48) {
        addAlert({
          type: 'prazo_critico',
          title: 'Prazo Crítico',
          message: `Coleta ${coleta.numero_coleta} está próxima do limite de 48h`,
          severity: 'warning',
          entityId: coleta.id,
          entityType: 'coleta',
        });
      }
    });
    
    // Check entregas with overdue delivery
    const { data: entregas } = await supabase
      .from('entregas')
      .select('id, numero_entrega, previsao_entrega, status')
      .not('status', 'in', '("entregue","finalizado")')
      .not('previsao_entrega', 'is', null);
    
    entregas?.forEach(entrega => {
      if (entrega.previsao_entrega) {
        const previsao = new Date(entrega.previsao_entrega);
        if (now > previsao) {
          addAlert({
            type: 'entrega_atrasada',
            title: 'Entrega Atrasada',
            message: `Entrega ${entrega.numero_entrega} passou da previsão`,
            severity: 'error',
            entityId: entrega.id,
            entityType: 'entrega',
          });
        }
      }
    });
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    // Subscribe to coletas changes
    const coletasChannel = supabase
      .channel('coletas-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coletas',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Check for divergence
          if (newRecord?.divergencia_percentual && newRecord.divergencia_percentual > 5) {
            const severity = newRecord.divergencia_percentual > 10 ? 'error' : 'warning';
            addAlert({
              type: 'divergencia',
              title: severity === 'error' ? 'Divergência Alta' : 'Divergência Detectada',
              message: `Coleta ${newRecord.numero_coleta} com ${newRecord.divergencia_percentual}% de divergência`,
              severity,
              entityId: newRecord.id,
              entityType: 'coleta',
            });
          }
          
          // Status change notifications
          if (oldRecord?.status !== newRecord?.status) {
            if (newRecord?.status === 'divergencia') {
              addAlert({
                type: 'divergencia',
                title: 'Status Divergência',
                message: `Coleta ${newRecord.numero_coleta} marcada com divergência`,
                severity: 'warning',
                entityId: newRecord.id,
                entityType: 'coleta',
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to entregas changes
    const entregasChannel = supabase
      .channel('entregas-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entregas',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Status change to ocorrencia
          if (oldRecord?.status !== newRecord?.status && newRecord?.status === 'ocorrencia') {
            addAlert({
              type: 'ocorrencia',
              title: 'Nova Ocorrência',
              message: `Entrega ${newRecord.numero_entrega} registrou ocorrência`,
              severity: 'error',
              entityId: newRecord.id,
              entityType: 'entrega',
            });
          }
        }
      )
      .subscribe();

    // Subscribe to ocorrencias
    const ocorrenciasChannel = supabase
      .channel('ocorrencias-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ocorrencias',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newRecord = payload.new as any;
          addAlert({
            type: 'ocorrencia',
            title: 'Nova Ocorrência Registrada',
            message: `Ocorrência: ${newRecord.tipo_ocorrencia}`,
            severity: 'error',
            entityId: newRecord.id,
            entityType: 'ocorrencia',
          });
        }
      )
      .subscribe();

    // Check critical deadlines every 5 minutes
    checkCriticalDeadlines();
    const interval = setInterval(checkCriticalDeadlines, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(coletasChannel);
      supabase.removeChannel(entregasChannel);
      supabase.removeChannel(ocorrenciasChannel);
      clearInterval(interval);
    };
  }, [checkCriticalDeadlines]);

  const markAsRead = useCallback((alertId: string) => {
    alertsStore = alertsStore.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    );
    notifyListeners();
  }, []);

  const markAllAsRead = useCallback(() => {
    alertsStore = alertsStore.map(a => ({ ...a, read: true }));
    notifyListeners();
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    alertsStore = alertsStore.filter(a => a.id !== alertId);
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

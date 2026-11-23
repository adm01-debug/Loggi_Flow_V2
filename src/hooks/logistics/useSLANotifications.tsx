import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/ui/use-toast";
import { differenceInHours, parseISO } from "date-fns";

export type NotificationPermissionState = "default" | "granted" | "denied";

interface SLANotificationConfig {
  enabled: boolean;
  criticalAlerts: boolean;
  warningAlerts: boolean;
  soundEnabled: boolean;
}

const DEFAULT_CONFIG: SLANotificationConfig = {
  enabled: true,
  criticalAlerts: true,
  warningAlerts: false,
  soundEnabled: true,
};

// Check if the browser supports notifications
const isNotificationSupported = () => {
  return "Notification" in window && "serviceWorker" in navigator;
};

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch {
    return "denied";
  }
}

// Show a browser notification
function showBrowserNotification(
  title: string,
  options: NotificationOptions & { onClick?: () => void }
) {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: options.tag || "sla-alert",
      requireInteraction: true,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      options.onClick?.();
    };

    // Auto-close after 30 seconds
    const autoCloseTimer = setTimeout(() => notification.close(), 30000);

    return () => {
      clearTimeout(autoCloseTimer);
      notification.close();
    };
  } catch {
    return null;
  }
}

// Play alert sound
// Type for webkit audio context
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function playAlertSound(type: "critical" | "warning"): () => void {
  let cancelar = () => undefined;

  try {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!AudioContextClass) return cancelar;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let encerrado = false;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Fecha o AudioContext: so parar o timer deixaria o contexto aberto
    const encerrarSom = () => {
      if (encerrado) return;
      encerrado = true;
      try {
        oscillator.stop();
      } catch {
        // ja parado pelo temporizador que encerra o som
      }
      void audioContext.close().catch(() => undefined);
    };

    if (type === "critical") {
      // Urgent beep pattern
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      oscillator.start();

      timers.push(
        setTimeout(() => {
          oscillator.frequency.value = 660;
        }, 150)
      );

      timers.push(
        setTimeout(() => {
          oscillator.frequency.value = 880;
        }, 300)
      );

      timers.push(setTimeout(encerrarSom, 450));
    } else {
      // Gentle notification
      oscillator.frequency.value = 523;
      gainNode.gain.value = 0.2;
      oscillator.start();

      timers.push(setTimeout(encerrarSom, 200));
    }

    cancelar = () => {
      timers.forEach(clearTimeout);
      encerrarSom();
    };
  } catch {
    // Silent fail on sound playback error
  }

  return cancelar;
}

export function useSLANotifications() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [config, setConfig] = useState<SLANotificationConfig>(() => {
    try {
      const saved = localStorage.getItem("sla-notification-config");
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const processedIds = useRef<Set<string>>(new Set());
  const cancelamentosRef = useRef<(() => void)[]>([]);

  // Cancela som e avisos pendentes quando o componente sai da tela
  useEffect(() => {
    const cancelamentos = cancelamentosRef.current;
    return () => {
      cancelamentos.forEach((cancelar) => cancelar());
      cancelamentos.length = 0;
    };
  }, []);

  // Check current permission status
  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(Notification.permission as NotificationPermissionState);
    }
  }, []);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem("sla-notification-config", JSON.stringify(config));
  }, [config]);

  // Request permission
  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    
    if (result === "granted") {
      toast({
        title: "Notificações ativadas",
        description: "Você receberá alertas de SLA críticos em tempo real",
      });
    } else if (result === "denied") {
      toast({
        title: "Notificações bloqueadas",
        description: "Habilite nas configurações do navegador para receber alertas",
        variant: "destructive",
      });
    }
    
    return result;
  }, [toast]);

  // Check if an entrega has critical SLA issues
  const checkEntregaSLA = useCallback((entrega: { previsao_entrega?: string; status?: string; numero_entrega?: string }) => {
    if (!entrega.previsao_entrega) return null;
    if (entrega.status && ["entregue", "cancelada"].includes(entrega.status)) return null;

    const prazo = parseISO(entrega.previsao_entrega);
    const now = new Date();
    const horasAtraso = differenceInHours(now, prazo);

    if (horasAtraso > 0) {
      return {
        type: "critical" as const,
        message: `Entrega ${entrega.numero_entrega} está atrasada há ${Math.floor(horasAtraso / 24)} dias e ${horasAtraso % 24} horas`,
        numero: entrega.numero_entrega || '',
      };
    } else if (horasAtraso > -24) {
      return {
        type: "warning" as const,
        message: `Entrega ${entrega.numero_entrega} vence em ${Math.abs(horasAtraso)} horas`,
        numero: entrega.numero_entrega || '',
      };
    }

    return null;
  }, []);

  // Check if a coleta has critical SLA issues
  const checkColetaSLA = useCallback((coleta: { data_prevista_coleta?: string; status?: string; numero_coleta?: string }) => {
    if (!coleta.data_prevista_coleta) return null;
    if (coleta.status && ["finalizada", "cancelada"].includes(coleta.status)) return null;

    const prazo = parseISO(coleta.data_prevista_coleta);
    const now = new Date();
    const horasAtraso = differenceInHours(now, prazo);

    if (horasAtraso > 0) {
      return {
        type: "critical" as const,
        message: `Coleta ${coleta.numero_coleta} está atrasada há ${Math.floor(horasAtraso / 24)} dias`,
        numero: coleta.numero_coleta || '',
      };
    } else if (horasAtraso > -12) {
      return {
        type: "warning" as const,
        message: `Coleta ${coleta.numero_coleta} vence em ${Math.abs(horasAtraso)} horas`,
        numero: coleta.numero_coleta || '',
      };
    }

    return null;
  }, []);

  // Handle SLA alert
  const handleSLAAlert = useCallback((
    alertType: "critical" | "warning",
    message: string,
    numero: string,
    recordType: "entrega" | "coleta"
  ) => {
    const alertKey = `${recordType}-${numero}`;
    
    // Don't notify for the same alert twice in this session
    if (processedIds.current.has(alertKey)) return;
    processedIds.current.add(alertKey);

    // Check if this type of alert is enabled
    if (alertType === "critical" && !config.criticalAlerts) return;
    if (alertType === "warning" && !config.warningAlerts) return;
    if (!config.enabled) return;

    // Play sound
    if (config.soundEnabled) {
      cancelamentosRef.current.push(playAlertSound(alertType));
    }

    // Show browser notification
    if (permission === "granted") {
      const cancelarAviso = showBrowserNotification(
        alertType === "critical" ? "🚨 Alerta Crítico de SLA" : "⚠️ Aviso de SLA",
        {
          body: message,
          tag: alertKey,
          onClick: () => {
            window.location.href = "/sla-dashboard";
          },
        }
      );
      if (cancelarAviso) cancelamentosRef.current.push(cancelarAviso);
    }

    // Also show in-app toast
    toast({
      title: alertType === "critical" ? "🚨 Alerta Crítico de SLA" : "⚠️ Aviso de SLA",
      description: message,
      variant: alertType === "critical" ? "destructive" : "default",
    });
  }, [config, permission, toast]);

  // Poll for SLA changes instead of Realtime (tables removed from publication for security)
  useEffect(() => {
    if (!config.enabled) return;

    let lastCheckedAt = new Date().toISOString();

    const interval = setInterval(async () => {
      // Check entregas
      const { data: entregas } = await supabase
        .from('entregas')
        .select('id, numero_entrega, status, previsao_entrega')
        .gt('updated_at', lastCheckedAt)
        .limit(50);

      if (entregas) {
        for (const e of entregas) {
          const alert = checkEntregaSLA(e as Parameters<typeof checkEntregaSLA>[0]);
          if (alert) handleSLAAlert(alert.type, alert.message, alert.numero, 'entrega');
        }
      }

      // Check coletas
      const { data: coletas } = await supabase
        .from('coletas')
        .select('id, numero_coleta, status, data_prevista_coleta')
        .gt('updated_at', lastCheckedAt)
        .limit(50);

      if (coletas) {
        for (const c of coletas) {
          const alert = checkColetaSLA(c as Parameters<typeof checkColetaSLA>[0]);
          if (alert) handleSLAAlert(alert.type, alert.message, alert.numero, 'coleta');
        }
      }

      lastCheckedAt = new Date().toISOString();
    }, 60000); // Check every 60s

    return () => clearInterval(interval);
  }, [config.enabled, checkEntregaSLA, checkColetaSLA, handleSLAAlert]);

  // Clear processed IDs periodically (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      processedIds.current.clear();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    permission,
    config,
    setConfig,
    requestPermission,
    isSupported: isNotificationSupported(),
  };
}

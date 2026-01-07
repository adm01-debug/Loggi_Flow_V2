import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    console.warn("Notifications not supported in this browser");
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
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
    setTimeout(() => notification.close(), 30000);

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
}

// Play alert sound
// Type for webkit audio context
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function playAlertSound(type: "critical" | "warning") {
  try {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === "critical") {
      // Urgent beep pattern
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      oscillator.start();
      
      setTimeout(() => {
        oscillator.frequency.value = 660;
      }, 150);
      
      setTimeout(() => {
        oscillator.frequency.value = 880;
      }, 300);
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 450);
    } else {
      // Gentle notification
      oscillator.frequency.value = 523;
      gainNode.gain.value = 0.2;
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    }
  } catch (error) {
    console.error("Error playing sound:", error);
  }
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
  const checkEntregaSLA = useCallback((entrega: any) => {
    if (!entrega.previsao_entrega) return null;
    if (["entregue", "cancelada"].includes(entrega.status)) return null;

    const prazo = parseISO(entrega.previsao_entrega);
    const now = new Date();
    const horasAtraso = differenceInHours(now, prazo);

    if (horasAtraso > 0) {
      return {
        type: "critical" as const,
        message: `Entrega ${entrega.numero_entrega} está atrasada há ${Math.floor(horasAtraso / 24)} dias e ${horasAtraso % 24} horas`,
        numero: entrega.numero_entrega,
      };
    } else if (horasAtraso > -24) {
      return {
        type: "warning" as const,
        message: `Entrega ${entrega.numero_entrega} vence em ${Math.abs(horasAtraso)} horas`,
        numero: entrega.numero_entrega,
      };
    }

    return null;
  }, []);

  // Check if a coleta has critical SLA issues
  const checkColetaSLA = useCallback((coleta: any) => {
    if (!coleta.data_prevista_coleta) return null;
    if (["finalizada", "cancelada"].includes(coleta.status)) return null;

    const prazo = parseISO(coleta.data_prevista_coleta);
    const now = new Date();
    const horasAtraso = differenceInHours(now, prazo);

    if (horasAtraso > 0) {
      return {
        type: "critical" as const,
        message: `Coleta ${coleta.numero_coleta} está atrasada há ${Math.floor(horasAtraso / 24)} dias`,
        numero: coleta.numero_coleta,
      };
    } else if (horasAtraso > -12) {
      return {
        type: "warning" as const,
        message: `Coleta ${coleta.numero_coleta} vence em ${Math.abs(horasAtraso)} horas`,
        numero: coleta.numero_coleta,
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
      playAlertSound(alertType);
    }

    // Show browser notification
    if (permission === "granted") {
      showBrowserNotification(
        alertType === "critical" ? "🚨 Alerta Crítico de SLA" : "⚠️ Aviso de SLA",
        {
          body: message,
          tag: alertKey,
          onClick: () => {
            window.location.href = "/sla-dashboard";
          },
        }
      );
    }

    // Also show in-app toast
    toast({
      title: alertType === "critical" ? "🚨 Alerta Crítico de SLA" : "⚠️ Aviso de SLA",
      description: message,
      variant: alertType === "critical" ? "destructive" : "default",
    });
  }, [config, permission, toast]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!config.enabled) return;

    // Setting up SLA notifications realtime subscription

    const channel = supabase
      .channel("sla-alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entregas",
        },
        (payload) => {
          // Entrega change detected
          
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const alert = checkEntregaSLA(payload.new);
            if (alert) {
              handleSLAAlert(alert.type, alert.message, alert.numero, "entrega");
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coletas",
        },
        (payload) => {
          // Coleta change detected
          
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const alert = checkColetaSLA(payload.new);
            if (alert) {
              handleSLAAlert(alert.type, alert.message, alert.numero, "coleta");
            }
          }
        }
      )
      .subscribe((status) => {
        // SLA notifications subscription status updated
      });

    return () => {
      // Cleaning up SLA notifications subscription
      supabase.removeChannel(channel);
    };
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

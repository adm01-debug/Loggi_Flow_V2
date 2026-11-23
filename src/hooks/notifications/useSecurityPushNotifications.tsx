import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  event_type: string;
  description: string;
  severity: string;
  user_id: string | null;
  ip_address: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export function useSecurityPushNotifications() {
  const { user, isAdmin } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const autoCloseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cancela os fechamentos automaticos pendentes quando o hook desmonta
  useEffect(() => {
    const timers = autoCloseTimersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsEnabled(result === 'granted');
      
      if (result === 'granted') {
        toast.success('Notificações push ativadas!');
        // Show test notification
        new Notification('🔐 Alertas de Segurança', {
          body: 'Você receberá notificações em tempo real sobre eventos de segurança.',
          icon: '/icons/icon-192.svg',
          tag: 'security-test',
        });
      } else if (result === 'denied') {
        toast.error('Permissão de notificações negada');
      }
      
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  // Show push notification
  const showNotification = useCallback((event: SecurityEvent) => {
    if (permission !== 'granted') return;

    const getSeverityEmoji = (severity: string) => {
      switch (severity) {
        case 'critical': return '🚨';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
      }
    };

    const getEventTitle = (type: string) => {
      const titles: Record<string, string> = {
        'new_device_login': 'Novo Dispositivo Detectado',
        'failed_login': 'Tentativa de Login Falhada',
        'password_changed': 'Senha Alterada',
        'mfa_enabled': 'MFA Ativado',
        'mfa_disabled': 'MFA Desativado',
        'suspicious_activity': 'Atividade Suspeita',
        'rate_limit_exceeded': 'Rate Limit Excedido',
        'account_locked': 'Conta Bloqueada',
        'ip_blocked': 'IP Bloqueado',
        'session_expired': 'Sessão Expirada',
      };
      return titles[type] || 'Evento de Segurança';
    };

    const emoji = getSeverityEmoji(event.severity);
    const title = `${emoji} ${getEventTitle(event.event_type)}`;

    try {
      const notification = new Notification(title, {
        body: event.description,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: `security-${event.id}`,
        requireInteraction: event.severity === 'critical',
        silent: false,
        data: { url: '/seguranca', eventId: event.id },
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/seguranca';
        notification.close();
      };

      // Auto-close non-critical notifications after 10 seconds
      if (event.severity !== 'critical') {
        autoCloseTimersRef.current.push(setTimeout(() => notification.close(), 10000));
      }
    } catch {
      // Silent fail - notification display is non-critical
    }
  }, [permission]);

  // Show in-app toast for security events
  const showInAppAlert = useCallback((event: SecurityEvent) => {
    const getSeverityType = (severity: string): 'info' | 'warning' | 'error' | 'success' => {
      switch (severity) {
        case 'critical':
        case 'error':
          return 'error';
        case 'warning':
          return 'warning';
        case 'success':
          return 'success';
        default:
          return 'info';
      }
    };

    const toastFn = {
      info: toast.info,
      warning: toast.warning,
      error: toast.error,
      success: toast.success,
    }[getSeverityType(event.severity)];

    toastFn(event.description, {
      duration: event.severity === 'critical' ? 10000 : 5000,
      action: {
        label: 'Ver detalhes',
        onClick: () => window.location.href = '/seguranca',
      },
    });
  }, []);

  // Poll for new security events instead of Realtime (tables removed from publication for security)
  useEffect(() => {
    if (!user?.id) return;

    let lastCheckedAt = new Date().toISOString();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('security_events')
        .select('*')
        .gt('created_at', lastCheckedAt)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        lastCheckedAt = data[0].created_at;
        for (const row of data) {
          const event = row as unknown as SecurityEvent;
          if (isAdmin || event.user_id === user.id) {
            showNotification(event);
            showInAppAlert(event);
          }
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user?.id, isAdmin, showNotification, showInAppAlert]);

  return {
    isEnabled,
    permission,
    requestPermission,
    showNotification,
  };
}

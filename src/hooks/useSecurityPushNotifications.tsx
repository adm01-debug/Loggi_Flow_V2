import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
        setTimeout(() => notification.close(), 10000);
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

  // Subscribe to realtime security events
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('security-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload) => {
          const event = payload.new as SecurityEvent;
          
          // For admins, show all events
          // For regular users, only show their own events
          if (isAdmin || event.user_id === user.id) {
            // Show push notification
            showNotification(event);
            
            // Also show in-app toast
            showInAppAlert(event);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAdmin, showNotification, showInAppAlert]);

  // Subscribe to login attempts for admins
  useEffect(() => {
    if (!user?.id || !isAdmin) return;

    const channel = supabase
      .channel('login-attempts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_attempts',
        },
        (payload) => {
          const attempt = payload.new as {
            id: string;
            email: string;
            success: boolean;
            failure_reason: string | null;
            ip_address: string | null;
            created_at: string;
          };
          
          // Only notify on failed attempts
          if (!attempt.success) {
            const event: SecurityEvent = {
              id: attempt.id,
              event_type: 'failed_login',
              description: `Tentativa de login falhada para ${attempt.email}${attempt.failure_reason ? `: ${attempt.failure_reason}` : ''}`,
              severity: 'warning',
              user_id: null,
              ip_address: attempt.ip_address,
              created_at: attempt.created_at,
              metadata: { email: attempt.email },
            };
            
            showNotification(event);
            showInAppAlert(event);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAdmin, showNotification, showInAppAlert]);

  // Subscribe to rate limit blocks for admins
  useEffect(() => {
    if (!user?.id || !isAdmin) return;

    const channel = supabase
      .channel('rate-limit-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rate_limit_logs',
          filter: 'blocked=eq.true',
        },
        (payload) => {
          const log = payload.new as {
            id: string;
            ip_address: string;
            endpoint: string;
            created_at: string;
          };
          
          const event: SecurityEvent = {
            id: log.id,
            event_type: 'rate_limit_exceeded',
            description: `IP ${log.ip_address} bloqueado por excesso de requisições em ${log.endpoint}`,
            severity: 'warning',
            user_id: null,
            ip_address: log.ip_address,
            created_at: log.created_at,
            metadata: { endpoint: log.endpoint },
          };
          
          showNotification(event);
          showInAppAlert(event);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAdmin, showNotification, showInAppAlert]);

  return {
    isEnabled,
    permission,
    requestPermission,
    showNotification,
  };
}

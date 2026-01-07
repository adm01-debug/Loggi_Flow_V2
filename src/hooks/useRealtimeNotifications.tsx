import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RealtimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface UseRealtimeNotificationsOptions {
  showToasts?: boolean;
  playSound?: boolean;
  maxNotifications?: number;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { showToasts = true, playSound = false, maxNotifications = 50 } = options;
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial notifications
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(maxNotifications);

        if (error) throw error;

        setNotifications(
          (data || []).map(n => ({
            id: n.id,
            type: n.type as RealtimeNotification['type'],
            title: n.title,
            message: n.message,
            timestamp: new Date(n.created_at),
            read: n.read,
            actionUrl: n.action_url || undefined,
            metadata: n.metadata as Record<string, unknown> | undefined
          }))
        );
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id, maxNotifications]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: RealtimeNotification = {
            id: payload.new.id,
            type: payload.new.type as RealtimeNotification['type'],
            title: payload.new.title,
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            read: payload.new.read,
            actionUrl: payload.new.action_url || undefined,
            metadata: payload.new.metadata as Record<string, unknown> | undefined
          };

          setNotifications(prev => [newNotification, ...prev].slice(0, maxNotifications));

          if (showToasts) {
            toast[newNotification.type === 'error' ? 'error' : newNotification.type === 'warning' ? 'warning' : 'info'](
              newNotification.title,
              { description: newNotification.message }
            );
          }

          if (playSound) {
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(n =>
              n.id === payload.new.id
                ? { ...n, read: payload.new.read }
                : n
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, showToasts, playSound, maxNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user?.id]);

  const clearAll = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
}

// Hook for realtime data sync
export function useRealtimeSync<T extends { id: string }>(
  table: string,
  initialData: T[] = [],
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const channelConfig: {
      event: '*';
      schema: 'public';
      table: string;
      filter?: string;
    } = {
      event: '*',
      schema: 'public',
      table
    };

    if (filter) {
      channelConfig.filter = `${filter.column}=eq.${filter.value}`;
    }

    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', channelConfig, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => [payload.new as T, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setData(prev =>
            prev.map(item =>
              item.id === (payload.new as T).id ? (payload.new as T) : item
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => item.id !== (payload.old as T).id));
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, [table, filter?.column, filter?.value]);

  return { data, setData, isConnected };
}

// Connection status indicator
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, lastOnline };
}

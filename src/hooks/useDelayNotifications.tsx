import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { differenceInHours, differenceInMinutes, isPast, parseISO } from 'date-fns';

interface DelayedItem {
  id: string;
  type: 'entrega' | 'coleta';
  numero: string;
  previsao: string;
  hoursLate: number;
  severity: 'warning' | 'critical';
}

export function useDelayNotifications() {
  const queryClient = useQueryClient();
  const { shouldShowNotification } = useNotificationPreferences();
  const notifiedIds = useRef<Set<string>>(new Set());
  const lastCheckTime = useRef<Date>(new Date());

  // Query for delayed entregas
  const { data: delayedEntregas = [] } = useQuery({
    queryKey: ['delayed-entregas'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('entregas')
        .select('id, numero_entrega, previsao_entrega, status')
        .in('status', ['despachado', 'em_transito', 'saiu_entrega'])
        .lt('previsao_entrega', now)
        .is('data_entrega_efetiva', null);
      return data || [];
    },
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Query for delayed coletas
  const { data: delayedColetas = [] } = useQuery({
    queryKey: ['delayed-coletas'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('coletas')
        .select('id, numero_coleta, data_prevista_coleta, status')
        .in('status', ['solicitada', 'em_transito'])
        .lt('data_prevista_coleta', now)
        .is('data_efetiva_coleta', null);
      return data || [];
    },
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Process and categorize delays
  const processDelays = useCallback((): DelayedItem[] => {
    const items: DelayedItem[] = [];
    const now = new Date();

    // Process entregas
    delayedEntregas.forEach((e) => {
      if (!e.previsao_entrega) return;
      const previsao = parseISO(e.previsao_entrega);
      const hoursLate = differenceInHours(now, previsao);
      
      items.push({
        id: e.id,
        type: 'entrega',
        numero: e.numero_entrega,
        previsao: e.previsao_entrega,
        hoursLate,
        severity: hoursLate >= 24 ? 'critical' : 'warning',
      });
    });

    // Process coletas
    delayedColetas.forEach((c) => {
      if (!c.data_prevista_coleta) return;
      const previsao = parseISO(c.data_prevista_coleta);
      const hoursLate = differenceInHours(now, previsao);
      
      items.push({
        id: c.id,
        type: 'coleta',
        numero: c.numero_coleta,
        previsao: c.data_prevista_coleta,
        hoursLate,
        severity: hoursLate >= 24 ? 'critical' : 'warning',
      });
    });

    return items.sort((a, b) => b.hoursLate - a.hoursLate);
  }, [delayedEntregas, delayedColetas]);

  // Show notifications for new delays
  const checkAndNotify = useCallback(() => {
    const delays = processDelays();
    
    delays.forEach((item) => {
      const notificationKey = `${item.type}-${item.id}-${item.severity}`;
      
      // Skip if already notified for this severity level
      if (notifiedIds.current.has(notificationKey)) return;
      
      // Check preferences
      const category = item.type === 'entrega' ? 'entregas' : 'coletas';
      if (!shouldShowNotification(item.severity, { category })) return;

      // Mark as notified
      notifiedIds.current.add(notificationKey);

      // Show toast
      const toastFn = item.severity === 'critical' ? toast.error : toast.warning;
      const emoji = item.severity === 'critical' ? '🚨' : '⚠️';
      const typeLabel = item.type === 'entrega' ? 'Entrega' : 'Coleta';
      
      toastFn(`${emoji} ${typeLabel} Atrasada`, {
        description: `${item.numero} está ${item.hoursLate}h atrasada`,
        duration: item.severity === 'critical' ? 10000 : 5000,
        action: {
          label: 'Ver',
          onClick: () => {
            window.location.href = item.type === 'entrega' ? '/envios' : '/coletas';
          },
        },
      });

      // Play sound for critical alerts
      if (item.severity === 'critical') {
        playAlertSound();
      }
    });
  }, [processDelays, shouldShowNotification]);

  // Check on mount and when data changes
  useEffect(() => {
    checkAndNotify();
  }, [delayedEntregas, delayedColetas, checkAndNotify]);

  // Clear old notification keys periodically
  useEffect(() => {
    const interval = setInterval(() => {
      notifiedIds.current.clear();
    }, 60 * 60 * 1000); // Clear every hour to allow re-notifications

    return () => clearInterval(interval);
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('delay-notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'entregas' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['delayed-entregas'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'coletas' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['delayed-coletas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const delayedItems = processDelays();
  const criticalCount = delayedItems.filter(i => i.severity === 'critical').length;
  const warningCount = delayedItems.filter(i => i.severity === 'warning').length;

  return {
    delayedItems,
    criticalCount,
    warningCount,
    totalCount: delayedItems.length,
    checkAndNotify,
  };
}

// Type for webkit audio context
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Simple audio alert
function playAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 600;
      osc2.type = 'sine';
      osc2.start();
      osc2.stop(audioContext.currentTime + 0.15);
    }, 200);
  } catch {
    // Audio not available
  }
}

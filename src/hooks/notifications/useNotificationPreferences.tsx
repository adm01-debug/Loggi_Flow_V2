import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/hooks/auth/useAuth";
import { QUERY_STALE_TIME } from '@/lib/queryConfig';

export interface NotificationPreferences {
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_whatsapp: boolean;
  notifications_sla: boolean;
  notifications_ocorrencias: boolean;
  notifications_coletas: boolean;
  notifications_entregas: boolean;
  notifications_custos: boolean;
  notifications_achievements: boolean;
}

const defaultPreferences: NotificationPreferences = {
  notifications_email: true,
  notifications_push: true,
  notifications_whatsapp: true,
  notifications_sla: true,
  notifications_ocorrencias: true,
  notifications_coletas: true,
  notifications_entregas: true,
  notifications_custos: true,
  notifications_achievements: true,
};

// Map notification types to preference keys
const typeToPreferenceMap: Record<string, keyof NotificationPreferences> = {
  'sla': 'notifications_sla',
  'sla_warning': 'notifications_sla',
  'sla_critical': 'notifications_sla',
  'ocorrencia': 'notifications_ocorrencias',
  'ocorrencias': 'notifications_ocorrencias',
  'coleta': 'notifications_coletas',
  'coletas': 'notifications_coletas',
  'entrega': 'notifications_entregas',
  'entregas': 'notifications_entregas',
  'custo': 'notifications_custos',
  'custos': 'notifications_custos',
  'cost': 'notifications_custos',
  'achievement': 'notifications_achievements',
  'conquista': 'notifications_achievements',
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load from DB
  const { data: dbPreferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Migrate from localStorage if present
        const saved = localStorage.getItem(`notification_prefs_${user!.id}`);
        let initialPrefs = { ...defaultPreferences };
        if (saved) {
          try { initialPrefs = { ...defaultPreferences, ...JSON.parse(saved) }; } catch { /* ignore */ }
        }

        // Create DB record
        const { data: newData, error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert({ user_id: user!.id, ...initialPrefs })
          .select()
          .single();

        if (insertError) throw insertError;
        // Clean up localStorage
        localStorage.removeItem(`notification_prefs_${user!.id}`);
        return newData;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: QUERY_STALE_TIME.USER,
  });

  const preferences: NotificationPreferences = dbPreferences
    ? {
        notifications_email: dbPreferences.notifications_email,
        notifications_push: dbPreferences.notifications_push,
        notifications_whatsapp: dbPreferences.notifications_whatsapp ?? true,
        notifications_sla: dbPreferences.notifications_sla,
        notifications_ocorrencias: dbPreferences.notifications_ocorrencias,
        notifications_coletas: dbPreferences.notifications_coletas,
        notifications_entregas: dbPreferences.notifications_entregas,
        notifications_custos: dbPreferences.notifications_custos,
        notifications_achievements: dbPreferences.notifications_achievements,
      }
    : defaultPreferences;

  const isLoaded = !isLoading && !!dbPreferences;

  // Save to DB
  const updateMutation = useMutation({
    mutationFn: async (newPrefs: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_notification_preferences')
        .update(newPrefs)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
  });

  // Save all preferences
  const savePreferences = useCallback((newPrefs: NotificationPreferences) => {
    updateMutation.mutate(newPrefs);
  }, [updateMutation]);

  // Update single preference
  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    updateMutation.mutate({ [key]: value });
  }, [updateMutation]);

  // Check if a notification should be shown based on preferences
  const shouldShowNotification = useCallback((
    notificationType: string,
    metadata?: Record<string, unknown>
  ): boolean => {
    if (!isLoaded) return true;
    if (!preferences.notifications_push) return false;

    const normalizedType = notificationType.toLowerCase();

    if (metadata?.category) {
      const category = String(metadata.category).toLowerCase();
      const prefKey = typeToPreferenceMap[category];
      if (prefKey && !preferences[prefKey]) return false;
    }

    const prefKey = typeToPreferenceMap[normalizedType];
    if (prefKey) return preferences[prefKey];
    return true;
  }, [preferences, isLoaded]);

  // Check if browser notifications should be shown
  const shouldShowBrowserNotification = useCallback((
    notificationType: string,
    metadata?: Record<string, unknown>
  ): boolean => {
    if (!preferences.notifications_push) return false;
    return shouldShowNotification(notificationType, metadata);
  }, [preferences.notifications_push, shouldShowNotification]);

  // Check if email notifications should be sent
  const shouldSendEmailNotification = useCallback((
    notificationType: string,
    metadata?: Record<string, unknown>
  ): boolean => {
    if (!preferences.notifications_email) return false;
    return shouldShowNotification(notificationType, metadata);
  }, [preferences.notifications_email, shouldShowNotification]);

  return {
    preferences,
    isLoaded,
    updatePreference,
    savePreferences,
    shouldShowNotification,
    shouldShowBrowserNotification,
    shouldSendEmailNotification,
  };
}

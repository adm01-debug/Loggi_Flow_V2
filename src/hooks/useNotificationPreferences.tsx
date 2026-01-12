import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationPreferences {
  notifications_email: boolean;
  notifications_push: boolean;
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
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`notification_prefs_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPreferences({ ...defaultPreferences, ...parsed });
        } catch {
          // Invalid JSON - use defaults
        }
      }
      setIsLoaded(true);
    }
  }, [user?.id]);

  // Save preferences
  const savePreferences = useCallback((newPrefs: NotificationPreferences) => {
    if (user?.id) {
      localStorage.setItem(`notification_prefs_${user.id}`, JSON.stringify(newPrefs));
      setPreferences(newPrefs);
    }
  }, [user?.id]);

  // Update single preference
  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Check if a notification should be shown based on preferences
  const shouldShowNotification = useCallback((
    notificationType: string,
    metadata?: Record<string, unknown>
  ): boolean => {
    // Always show if preferences not loaded yet
    if (!isLoaded) return true;

    // Check if push notifications are enabled
    if (!preferences.notifications_push) return false;

    // Check specific type preference
    const normalizedType = notificationType.toLowerCase();
    
    // Check metadata for category hints
    if (metadata?.category) {
      const category = String(metadata.category).toLowerCase();
      const prefKey = typeToPreferenceMap[category];
      if (prefKey && !preferences[prefKey]) return false;
    }

    // Check type-based preference
    const prefKey = typeToPreferenceMap[normalizedType];
    if (prefKey) {
      return preferences[prefKey];
    }

    // Default to showing unknown types
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

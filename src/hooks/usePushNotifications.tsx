import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Generate VAPID keys properly - in production, these should come from environment/secrets
const getVapidKey = (): string => {
  // This is a demo public key - in production, use VAPID keys from your server
  return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
};

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);
      
      // Verify subscription is saved in user preferences
      if (sub) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const saved = localStorage.getItem(`push_subscription_${user.id}`);
          if (!saved) {
            // Save subscription to localStorage as fallback
            localStorage.setItem(`push_subscription_${user.id}`, JSON.stringify({
              endpoint: sub.endpoint,
              keys: {
                p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
                auth: arrayBufferToBase64(sub.getKey('auth')),
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('[usePushNotifications] Error checking subscription:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações push não são suportadas neste navegador');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Permissão concedida para notificações!');
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão negada. Você não receberá notificações push.');
        return false;
      } else {
        toast.info('Permissão pendente');
        return false;
      }
    } catch (error) {
      console.error('[usePushNotifications] Error requesting permission:', error);
      toast.error('Erro ao solicitar permissão');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações push não são suportadas');
      return false;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setIsLoading(true);
    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications with VAPID key
      const vapidKey = getVapidKey();
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Store subscription data
      const subscriptionData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
          auth: arrayBufferToBase64(sub.getKey('auth')),
        }
      };

      // Save subscription to localStorage for persistence
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`push_subscription_${user.id}`, JSON.stringify(subscriptionData));
      }

      setSubscription(sub);
      setIsSubscribed(true);
      toast.success('Inscrito para notificações push!');
      return true;
    } catch (error) {
      console.error('[usePushNotifications] Error subscribing:', error);
      toast.error('Erro ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        
        // Remove from localStorage
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.removeItem(`push_subscription_${user.id}`);
        }
        
        setSubscription(null);
        setIsSubscribed(false);
        toast.success('Desinscrição realizada com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[usePushNotifications] Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('[usePushNotifications] Cannot send notification - not permitted');
      return;
    }

    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        ...options,
      });
    });
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

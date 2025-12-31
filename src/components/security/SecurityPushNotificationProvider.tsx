import { useSecurityPushNotifications } from '@/hooks/useSecurityPushNotifications';

export function SecurityPushNotificationProvider() {
  // This hook sets up realtime subscriptions for security events
  useSecurityPushNotifications();
  
  // This is a utility component, it doesn't render anything
  return null;
}

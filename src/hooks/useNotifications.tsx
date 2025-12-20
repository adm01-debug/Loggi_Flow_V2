import { useState, useCallback } from "react";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "achievement";
  read: boolean;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

// Stub implementation - notifications table doesn't exist yet
export function useNotifications() {
  const [notifications] = useState<Notification[]>([]);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }
    
    if (Notification.permission === "granted") {
      return true;
    }
    
    if (Notification.permission !== "denied") {
      const permission = await window.Notification.requestPermission();
      return permission === "granted";
    }
    
    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (window.Notification.permission === "granted") {
      new window.Notification(title, options);
    }
  }, []);

  // Computed values
  const unreadCount = 0;
  const unreadNotifications: Notification[] = [];
  const recentNotifications: Notification[] = [];

  return {
    notifications,
    unreadNotifications,
    recentNotifications,
    unreadCount,
    isLoading: false,
    markAsRead: (_id: string) => {},
    markAllAsRead: () => {},
    isMarkingAsRead: false,
    requestPermission,
    showBrowserNotification,
  };
}

// Helper hook for notification badge
export function useNotificationBadge() {
  return 0;
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";

// Session configuration
const SESSION_DURATION_HOURS = 24;
const SESSION_WARNING_MINUTES = 5;
const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

interface SessionInfo {
  expiresAt: Date | null;
  remainingMinutes: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export function useSessionTimeout() {
  const { user, session } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    expiresAt: null,
    remainingMinutes: SESSION_DURATION_HOURS * 60,
    isExpiringSoon: false,
    isExpired: false,
  });
  const [showWarning, setShowWarning] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        return false;
      }
      
      if (data.session) {
        setShowWarning(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Silent fail on sign out error
    }
  }, []);

  useEffect(() => {
    if (!session?.expires_at) return;

    const checkSession = () => {
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingMinutes = Math.max(0, Math.floor(remainingMs / (60 * 1000)));
      const isExpiringSoon = remainingMinutes <= SESSION_WARNING_MINUTES;
      const isExpired = remainingMinutes <= 0;

      setSessionInfo({
        expiresAt,
        remainingMinutes,
        isExpiringSoon,
        isExpired,
      });

      if (isExpiringSoon && !isExpired) {
        setShowWarning(true);
      }

      if (isExpired) {
        signOut();
      }
    };

    // Initial check
    checkSession();

    // Set up interval
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [session?.expires_at, signOut]);

  // Auto-refresh on user activity
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      // Only auto-refresh if session is expiring soon
      if (sessionInfo.isExpiringSoon && !sessionInfo.isExpired) {
        refreshSession();
      }
    };

    // Listen for user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    let debounceTimer: NodeJS.Timeout;

    const debouncedHandler = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleActivity, 1000);
    };

    events.forEach((event) => {
      window.addEventListener(event, debouncedHandler, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, debouncedHandler);
      });
      clearTimeout(debounceTimer);
    };
  }, [user, sessionInfo.isExpiringSoon, sessionInfo.isExpired, refreshSession]);

  return {
    sessionInfo,
    showWarning,
    setShowWarning,
    refreshSession,
    signOut,
  };
}

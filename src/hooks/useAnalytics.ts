import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAnalytics() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const trackPageView = async () => {
      if (!user) return;

      try {
        await supabase.from("security_events").insert({
          user_id: user.id,
          event_type: "page_view",
          description: `Visualizou a página: ${location.pathname}`,
          severity: "low",
          ip_address: "client-side",
          metadata: {
            path: location.pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        });
      } catch (error) {
        console.error("Erro ao registrar analytics:", error);
      }
    };

    trackPageView();
  }, [location.pathname, user]);

  const trackAction = async (action: string, metadata: Record<string, any> = {}) => {
    if (!user) return;

    try {
      await supabase.from("security_events").insert({
        user_id: user.id,
        event_type: "user_action",
        description: `Ação realizada: ${action}`,
        severity: "low",
        ip_address: "client-side",
        metadata: {
          action,
          ...metadata,
          path: location.pathname,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Erro ao registrar ação:", error);
    }
  };

  return { trackAction };
}

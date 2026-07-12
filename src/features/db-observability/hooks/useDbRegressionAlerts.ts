import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

/**
 * Inscreve o usuário admin em notifications realtime e emite toast crítico
 * quando o evento `db_regression` é recebido.
 */
export function useDbRegressionAlerts() {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel(`db-regression-alerts-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const meta = (payload.new as { metadata?: { event?: string } })?.metadata;
          if (meta?.event === "db_regression") {
            toast.error(
              (payload.new as { title?: string }).title ?? "Regressão de query",
              {
                description: (payload.new as { message?: string }).message,
                duration: 10_000,
                action: {
                  label: "Abrir painel",
                  onClick: () => {
                    window.location.href = "/admin/db-health";
                  },
                },
              },
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);
}

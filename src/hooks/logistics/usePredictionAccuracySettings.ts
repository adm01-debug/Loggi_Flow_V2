import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AccuracySettings {
  target_pct: number;
  consecutive_days_alert: number;
  notify_email: boolean;
  notify_whatsapp: boolean;
  email: string | null;
  whatsapp_phone: string | null;
}

const DEFAULT: AccuracySettings = {
  target_pct: 80,
  consecutive_days_alert: 3,
  notify_email: false,
  notify_whatsapp: false,
  email: null,
  whatsapp_phone: null,
};
const LEGACY_TARGET_KEY = "prediction_accuracy_target";

function keyFor(carrier: string | null) {
  return ["prediction-accuracy-settings", carrier ?? "__all__"] as const;
}

export function usePredictionAccuracySettings(carrier: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: keyFor(carrier),
    queryFn: async (): Promise<AccuracySettings> => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return DEFAULT;

      let q = supabase
        .from("prediction_accuracy_settings" as never)
        .select(
          "target_pct, consecutive_days_alert, transportadora, notify_email, notify_whatsapp, email, whatsapp_phone",
        )
        .eq("user_id", uid);
      q = carrier
        ? q.eq("transportadora", carrier)
        : q.is("transportadora", null);

      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (data) {
        const row = data as unknown as Partial<AccuracySettings>;
        return {
          target_pct: Number(row.target_pct) || DEFAULT.target_pct,
          consecutive_days_alert:
            Number(row.consecutive_days_alert) ||
            DEFAULT.consecutive_days_alert,
          notify_email: Boolean(row.notify_email),
          notify_whatsapp: Boolean(row.notify_whatsapp),
          email: row.email ?? null,
          whatsapp_phone: row.whatsapp_phone ?? null,
        };
      }
      // Migração leve do localStorage (uma única vez)
      if (!carrier) {
        const legacy = Number(localStorage.getItem(LEGACY_TARGET_KEY));
        if (Number.isFinite(legacy) && legacy > 0) {
          return { ...DEFAULT, target_pct: legacy };
        }
      }
      return DEFAULT;
    },
    staleTime: 1000 * 60 * 5,
  });

  const save = useCallback(
    async (patch: Partial<AccuracySettings>) => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (!uid) return;
        const current = query.data ?? DEFAULT;
        const next: AccuracySettings = { ...current, ...patch };
        const { error } = await supabase
          .from("prediction_accuracy_settings" as never)
          .upsert(
            {
              user_id: uid,
              transportadora: carrier,
              target_pct: next.target_pct,
              consecutive_days_alert: next.consecutive_days_alert,
              notify_email: next.notify_email,
              notify_whatsapp: next.notify_whatsapp,
              email: next.email,
              whatsapp_phone: next.whatsapp_phone,
            } as never,
            { onConflict: "user_id,transportadora" },
          );
        if (error) throw error;
        qc.setQueryData(keyFor(carrier), next);
      } catch (e) {
        toast.error("N\u00e3o foi poss\u00edvel salvar: " + (e as Error).message);
        throw e;
      }
    },
    [carrier, qc, query.data],
  );

  return { ...query, save };
}

export function useBreachDays(target: number, carrier: string | null) {
  return useQuery({
    queryKey: ["prediction-breach-days", target, carrier],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc(
        "count_prediction_breach_days" as never,
        {
          _target: target,
          _carrier: carrier,
        } as never,
      );
      if (error) throw error;
      return Number(data ?? 0);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Debounce leve para persistir alterações no input sem hammer no banco. */
export function useDebouncedEffect(
  effect: () => void,
  delay: number,
  deps: unknown[],
) {
  useEffect(() => {
    const t = setTimeout(effect, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

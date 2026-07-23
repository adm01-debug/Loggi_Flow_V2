import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CycleItem {
  transportadora: string | null;
  target_pct: number;
  consecutive_days_alert: number;
  breach_days: number;
  notified_in_cycle: boolean;
  status: "pending" | "notified" | "ok" | "warming";
}

export interface AccuracyMetaCycle {
  nextRunAt: Date;
  lastNotifiedAt: Date | null;
  items: CycleItem[];
}

// Cron: "15 8 * * *" UTC — próxima execução às 08:15 UTC.
function computeNextRun(now = new Date()): Date {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 15, 0, 0),
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

export function useAccuracyMetaCycle() {
  return useQuery({
    queryKey: ["accuracy-meta-cycle"],
    queryFn: async (): Promise<AccuracyMetaCycle> => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const nextRunAt = computeNextRun();

      if (!uid) return { nextRunAt, lastNotifiedAt: null, items: [] };

      const { data: settings, error } = await supabase
        .from("prediction_accuracy_settings" as never)
        .select("transportadora, target_pct, consecutive_days_alert")
        .eq("user_id", uid);
      if (error) throw error;

      const rows = (settings ?? []) as Array<{
        transportadora: string | null;
        target_pct: number;
        consecutive_days_alert: number;
      }>;

      const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const items: CycleItem[] = await Promise.all(
        rows.map(async (s) => {
          const [{ data: breach }, { data: notif }] = await Promise.all([
            supabase.rpc("count_prediction_breach_days" as never, {
              _target: s.target_pct,
              _carrier: s.transportadora,
            } as never),
            supabase
              .from("notifications")
              .select("id")
              .eq("user_id", uid)
              .gte("created_at", dayAgoIso)
              .contains("metadata", {
                source: "accuracy-meta-monitor",
                carrier: s.transportadora ?? "__all__",
              })
              .limit(1),
          ]);
          const breach_days = Number(breach ?? 0);
          const notified_in_cycle = !!(notif && notif.length > 0);
          let status: CycleItem["status"] = "ok";
          if (breach_days >= s.consecutive_days_alert) {
            status = notified_in_cycle ? "notified" : "pending";
          } else if (breach_days > 0) {
            status = "warming";
          }
          return {
            transportadora: s.transportadora,
            target_pct: Number(s.target_pct),
            consecutive_days_alert: s.consecutive_days_alert,
            breach_days,
            notified_in_cycle,
            status,
          };
        }),
      );

      const { data: lastNotif } = await supabase
        .from("notifications")
        .select("created_at")
        .eq("user_id", uid)
        .contains("metadata", { source: "accuracy-meta-monitor" })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        nextRunAt,
        lastNotifiedAt: lastNotif?.created_at ? new Date(lastNotif.created_at) : null,
        items,
      };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

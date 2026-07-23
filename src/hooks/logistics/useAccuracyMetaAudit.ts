import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AccuracyMetaAuditRow {
  id: string;
  created_at: string;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  carrier: string | null;
  target_pct: number | null;
  breach_days: number | null;
  actual_pct: number | null;
}

interface Meta {
  source?: string;
  carrier?: string | null;
  target_pct?: number;
  breach_days?: number;
  actual_pct?: number;
}

export function useAccuracyMetaAudit(limit = 100) {
  return useQuery({
    queryKey: ["accuracy-meta-audit", limit],
    queryFn: async (): Promise<AccuracyMetaAuditRow[]> => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("id, created_at, title, message, read, read_at, metadata")
        .eq("user_id", uid)
        .contains("metadata", { source: "accuracy-meta-monitor" })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      return (data ?? []).map((n) => {
        const m = (n.metadata as Meta | null) ?? {};
        return {
          id: n.id,
          created_at: n.created_at,
          title: n.title,
          message: n.message,
          read: n.read,
          read_at: n.read_at,
          carrier: m.carrier ?? null,
          target_pct: typeof m.target_pct === "number" ? m.target_pct : null,
          breach_days: typeof m.breach_days === "number" ? m.breach_days : null,
          actual_pct: typeof m.actual_pct === "number" ? m.actual_pct : null,
        };
      });
    },
    staleTime: 1000 * 60,
  });
}

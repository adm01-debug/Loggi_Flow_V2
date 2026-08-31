import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RemediationMttr {
  category: string;
  total_applied: number;
  total_resolved: number;
  total_ignored: number;
  total_pending: number;
  resolution_rate_pct: number | null;
  mttr_hours: number | null;
  mttr_p50_hours: number | null;
  mttr_p95_hours: number | null;
  last_resolved_at: string | null;
}

export function useRemediationMttr() {
  return useQuery({
    queryKey: ["remediation-mttr"],
    queryFn: async (): Promise<RemediationMttr[]> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_remediation_mttr_fast");
      if (error) throw error as Error;
      return (data as RemediationMttr[] | null) ?? [];
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IndexRoiSummary {
  total_proposed: number;
  total_applied: number;
  total_reverted: number;
  total_rejected: number;
  measured_count: number;
  avg_improvement_pct: number | null;
  best_improvement_pct: number | null;
  worst_improvement_pct: number | null;
  total_ms_saved_per_call: number | null;
  effective_indexes: number;
  ineffective_indexes: number;
}

export function useIndexRoi() {
  return useQuery({
    queryKey: ["index-roi-summary"],
    queryFn: async (): Promise<IndexRoiSummary | null> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_index_roi_summary");
      if (error) throw error as Error;
      const rows = data as IndexRoiSummary[] | null;
      return rows && rows.length > 0 ? rows[0] : null;
    },
    staleTime: 60_000,
  });
}

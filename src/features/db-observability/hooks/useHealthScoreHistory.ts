import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HealthScoreHistoryPoint {
  captured_at: string;
  overall_score: number;
  grade: string;
  slo_score: number;
  anomaly_score: number;
  mttr_score: number;
  capacity_score: number;
}

export function useHealthScoreHistory(days = 30) {
  return useQuery({
    queryKey: ["health-score-history", days],
    queryFn: async (): Promise<HealthScoreHistoryPoint[]> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_health_score_history_fast", { p_days: days });
      if (error) throw error as Error;
      return (data as HealthScoreHistoryPoint[] | null) ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

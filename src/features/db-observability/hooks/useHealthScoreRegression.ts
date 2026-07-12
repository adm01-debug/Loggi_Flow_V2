import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HealthRegression {
  current_score: number;
  previous_score: number;
  delta: number;
  regression_detected: boolean;
  current_at: string;
  previous_at: string;
}

export function useHealthScoreRegression() {
  return useQuery({
    queryKey: ["health-score-regression"],
    queryFn: async (): Promise<HealthRegression | null> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("detect_health_score_regression", { p_threshold: 10 });
      if (error) throw error as Error;
      const rows = data as HealthRegression[] | null;
      return rows?.[0] ?? null;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

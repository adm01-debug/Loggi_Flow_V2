import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GlobalHealthScore {
  overall_score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  slo_score: number;
  anomaly_score: number;
  mttr_score: number;
  capacity_score: number;
  computed_at: string;
  details: {
    critical_anomalies: number;
    warning_anomalies: number;
    critical_capacity: number;
    warning_capacity: number;
    avg_mttr_hours: number;
    resolution_rate_pct: number;
    weights: Record<string, number>;
  };
}

export function useGlobalHealthScore() {
  return useQuery({
    queryKey: ["global-health-score"],
    queryFn: async (): Promise<GlobalHealthScore | null> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_global_health_score_fast");
      if (error) throw error as Error;
      const rows = data as GlobalHealthScore[] | null;
      return rows?.[0] ?? null;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

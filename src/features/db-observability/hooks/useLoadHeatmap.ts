import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeatmapCell {
  day_of_week: number;
  hour_of_day: number;
  sample_count: number;
  avg_active_connections: number;
  max_active_connections: number;
  avg_cache_hit_ratio: number | null;
  intensity: number;
}

export function useLoadHeatmap(days = 30) {
  return useQuery({
    queryKey: ["load-heatmap", days],
    queryFn: async (): Promise<HeatmapCell[]> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_load_heatmap", { p_days: days });
      if (error) throw error as Error;
      return (data as HeatmapCell[] | null) ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

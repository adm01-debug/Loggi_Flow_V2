import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CacheHitRatio {
  schema_name: string;
  table_name: string;
  heap_blks_read: number;
  heap_blks_hit: number;
  heap_hit_ratio: number;
  idx_blks_read: number;
  idx_blks_hit: number;
  idx_hit_ratio: number;
  combined_hit_ratio: number;
  table_size_bytes: number;
  severity: "critical" | "warning" | "info" | "ok";
  recommendation: string;
}

export function useCacheHitRatios() {
  return useQuery({
    queryKey: ["db-observability", "cache-hit-ratios"],
    queryFn: async (): Promise<CacheHitRatio[]> => {
      const { data, error } = await supabase.rpc("get_cache_hit_ratios", {
        p_min_reads: 10000,
        p_max_ratio: 0.99,
        p_limit: 30,
      });
      if (error) throw error;
      return (data ?? []) as unknown as CacheHitRatio[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

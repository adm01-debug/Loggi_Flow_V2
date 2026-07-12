import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BloatHotspot {
  schema_name: string;
  table_name: string;
  live_tuples: number;
  dead_tuples: number;
  dead_pct: number;
  table_size_bytes: number;
  estimated_bloat_bytes: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
  vacuum_ddl: string;
  severity: "critical" | "warning" | "info" | "ok";
}

export function useBloatHotspots(minDeadTuples = 1000, limit = 25) {
  return useQuery({
    queryKey: ["db-observability", "bloat-hotspots", minDeadTuples, limit],
    queryFn: async (): Promise<BloatHotspot[]> => {
      const { data, error } = await supabase.rpc("get_bloat_hotspots", {
        p_min_dead_tuples: minDeadTuples,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as BloatHotspot[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AutovacuumHealth {
  schema_name: string;
  table_name: string;
  live_tuples: number;
  dead_tuples: number;
  dead_pct: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
  last_autoanalyze: string | null;
  days_since_vacuum: number | null;
  vacuum_count: number;
  autovacuum_count: number;
  severity: "critical" | "warning" | "ok";
  recommended_action: string;
}

export function useAutovacuumHealth(limit = 50) {
  return useQuery({
    queryKey: ["db-observability", "autovacuum-health", limit],
    queryFn: async (): Promise<AutovacuumHealth[]> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
      const { data, error } = await rpc("get_autovacuum_health", { p_limit: limit });
      if (error) throw new Error(error.message);
      return (data ?? []) as AutovacuumHealth[];
    },
    staleTime: 5 * 60_000,
  });
}

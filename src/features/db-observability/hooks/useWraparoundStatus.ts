import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WraparoundStatus {
  schema_name: string;
  table_name: string;
  xid_age: number;
  freeze_max_age: number;
  pct_towards_wraparound: number;
  last_autovacuum: string | null;
  table_size_bytes: number;
  severity: "critical" | "warning" | "ok";
  recommendation: string;
}

export function useWraparoundStatus(limit = 50) {
  return useQuery({
    queryKey: ["db-observability", "wraparound", limit],
    queryFn: async (): Promise<WraparoundStatus[]> => {
      const { data, error } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: unknown }>
      )("get_wraparound_status", { p_limit: limit });
      if (error) throw error as Error;
      return (data ?? []) as WraparoundStatus[];
    },
    staleTime: 10 * 60_000,
  });
}

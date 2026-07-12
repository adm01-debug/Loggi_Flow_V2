import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopTableSize {
  schema_name: string;
  table_name: string;
  total_bytes: number;
  table_bytes: number;
  indexes_bytes: number;
  toast_bytes: number;
  estimated_rows: number;
  bytes_per_row: number;
  severity: "critical" | "warning" | "info" | "ok";
  recommendation: string;
}

export function useTopTablesBySize(limit = 30) {
  return useQuery({
    queryKey: ["db-observability", "top-tables-size", limit],
    queryFn: async (): Promise<TopTableSize[]> => {
      const { data, error } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: unknown }>
      )("get_top_tables_by_size", { p_limit: limit });
      if (error) throw error as Error;
      return (data ?? []) as TopTableSize[];
    },
    staleTime: 10 * 60_000,
  });
}

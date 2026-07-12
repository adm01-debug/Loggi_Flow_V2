import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DuplicateIndex {
  schema_name: string;
  table_name: string;
  keep_index: string;
  keep_columns: string;
  keep_size_bytes: number;
  keep_scans: number;
  drop_index: string;
  drop_columns: string;
  drop_size_bytes: number;
  drop_scans: number;
  relationship: "exact_duplicate" | "prefix_redundant";
  drop_ddl: string;
  severity: "critical" | "warning" | "info";
}

export function useDuplicateIndexes(limit = 30) {
  return useQuery({
    queryKey: ["db-observability", "duplicate-indexes", limit],
    queryFn: async (): Promise<DuplicateIndex[]> => {
      const { data, error } = await supabase.rpc("get_duplicate_indexes", { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as unknown as DuplicateIndex[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

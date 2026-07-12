import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnusedIndex {
  schema_name: string;
  table_name: string;
  index_name: string;
  index_scans: number;
  index_size_bytes: number;
  table_size_bytes: number;
  is_unique: boolean;
  is_primary: boolean;
  drop_ddl: string;
  severity: "critical" | "warning" | "info" | "ok";
}

export function useUnusedIndexes(minSizeBytes = 1_048_576, limit = 30) {
  return useQuery({
    queryKey: ["db-observability", "unused-indexes", minSizeBytes, limit],
    queryFn: async (): Promise<UnusedIndex[]> => {
      const { data, error } = await supabase.rpc("get_unused_indexes", {
        p_min_size_bytes: minSizeBytes,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as UnusedIndex[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

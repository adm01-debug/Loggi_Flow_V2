import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnindexedFk {
  table_name: string;
  constraint_name: string;
  fk_columns: string[];
  referenced_table: string;
  table_size_bytes: number;
  suggested_ddl: string;
  severity: "critical" | "warning" | "info";
}

export function useUnindexedForeignKeys() {
  return useQuery({
    queryKey: ["db-observability", "unindexed-fks"],
    queryFn: async (): Promise<UnindexedFk[]> => {
      const { data, error } = await supabase.rpc("get_unindexed_foreign_keys");
      if (error) throw error;
      return (data ?? []) as unknown as UnindexedFk[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

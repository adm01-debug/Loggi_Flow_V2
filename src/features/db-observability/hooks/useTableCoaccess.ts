import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TableCoaccessEdge {
  table_a: string;
  table_b: string;
  co_occurrences: number;
  total_calls: number;
  total_time_ms: number;
  avg_mean_ms: number;
}

export function useTableCoaccess(limit = 30) {
  return useQuery({
    queryKey: ["db-observability", "table-coaccess", limit],
    queryFn: async (): Promise<TableCoaccessEdge[]> => {
      const { data, error } = await supabase.rpc(
        // @ts-expect-error - função nova, tipos regerados após aprovação
        "get_table_coaccess_graph",
        { p_limit: limit },
      );
      if (error) throw error;
      return (data ?? []) as TableCoaccessEdge[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

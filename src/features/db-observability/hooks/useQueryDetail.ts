import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QueryDetail {
  queryid: number;
  query_text: string;
  calls: number;
  total_exec_ms: number;
  mean_exec_ms: number;
  min_exec_ms: number;
  max_exec_ms: number;
  stddev_exec_ms: number;
  rows_returned: number;
  shared_blks_hit: number;
  shared_blks_read: number;
  cache_hit_pct: number | null;
}

export interface QueryIndexSuggestion {
  suggestion_type: string;
  target_table: string | null;
  target_columns: string[] | null;
  recommended_ddl: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
}

export function useQueryDetail(queryid: number | null) {
  return useQuery({
    queryKey: ["query-detail", queryid],
    enabled: queryid !== null,
    queryFn: async (): Promise<QueryDetail | null> => {
      if (queryid === null) return null;
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_query_detail_fast", { p_queryid: queryid });
      if (error) throw error as Error;
      const rows = data as QueryDetail[] | null;
      return rows?.[0] ?? null;
    },
    staleTime: 30_000,
  });
}

export function useQueryIndexSuggestion(queryid: number | null) {
  return useQuery({
    queryKey: ["query-index-suggestion", queryid],
    enabled: queryid !== null,
    queryFn: async (): Promise<QueryIndexSuggestion[]> => {
      if (queryid === null) return [];
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_query_index_suggestion", { p_queryid: queryid });
      if (error) throw error as Error;
      return (data as QueryIndexSuggestion[] | null) ?? [];
    },
    staleTime: 60_000,
  });
}

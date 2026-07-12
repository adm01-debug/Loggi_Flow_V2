import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TopQuery } from "../types";

export function useTopQueries(limit = 10) {
  return useQuery({
    queryKey: ["db-observability", "top-queries", limit],
    queryFn: async (): Promise<TopQuery[]> => {
      // RPC recém-criada — tipos gerados podem ainda não refletir.
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)(
        "get_top_queries_fast",
        { p_limit: limit },
      );
      if (error) throw error as Error;
      return (data ?? []) as TopQuery[];
    },
    staleTime: 60_000,
  });
}

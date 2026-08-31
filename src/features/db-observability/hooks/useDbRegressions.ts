import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { QueryRegression } from "../types";

export function useDbRegressions() {
  return useQuery({
    queryKey: ["db-observability", "regressions"],
    queryFn: async (): Promise<QueryRegression[]> => {
      const { data, error } = await supabase.rpc("get_query_regressions_fast");
      if (error) throw error;
      return (data ?? []) as QueryRegression[];
    },
    staleTime: 60_000,
  });
}

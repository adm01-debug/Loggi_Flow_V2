import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RemediationSuggestion } from "../types";

export function useRemediationSuggestions() {
  return useQuery({
    queryKey: ["db-observability", "remediation-suggestions"],
    queryFn: async (): Promise<RemediationSuggestion[]> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: unknown; error: unknown }>)(
        "get_remediation_suggestions_fast",
      );
      if (error) throw error as Error;
      return (data ?? []) as RemediationSuggestion[];
    },
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CapacityForecast } from "../types";

export function useCapacityForecast(hoursAhead = 168) {
  return useQuery({
    queryKey: ["db-observability", "capacity-forecast", hoursAhead],
    queryFn: async (): Promise<CapacityForecast[]> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)(
        "get_capacity_forecast_fast",
        { p_hours_ahead: hoursAhead },
      );
      if (error) throw error as Error;
      return (data ?? []) as CapacityForecast[];
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HealthAnomaly } from "../types";

export function useHealthAnomalies() {
  return useQuery({
    queryKey: ["db-observability", "health-anomalies"],
    queryFn: async (): Promise<HealthAnomaly[]> => {
      const { data, error } = await supabase.rpc("get_health_anomalies_fast" as never);
      if (error) throw error;
      return (data ?? []) as unknown as HealthAnomaly[];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

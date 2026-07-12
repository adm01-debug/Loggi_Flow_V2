import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HealthSnapshot } from "../types";

export function useHealthSnapshots(days = 7) {
  return useQuery({
    queryKey: ["db-observability", "health-snapshots", days],
    queryFn: async (): Promise<HealthSnapshot[]> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("db_health_snapshots" as never)
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as HealthSnapshot[];
    },
    staleTime: 60_000,
  });
}

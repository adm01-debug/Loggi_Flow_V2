import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SloDaily } from "../types";

export function useSloDaily(days = 30) {
  return useQuery({
    queryKey: ["db-observability", "slo-daily", days],
    queryFn: async (): Promise<SloDaily[]> => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("db_slo_daily" as never)
        .select("*")
        .gte("day", since)
        .order("day", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SloDaily[];
    },
    staleTime: 5 * 60_000,
  });
}

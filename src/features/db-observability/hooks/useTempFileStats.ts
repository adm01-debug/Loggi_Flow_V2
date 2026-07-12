import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TempFileStat {
  scope: "database" | "query";
  identifier: string;
  temp_files: number;
  temp_bytes: number;
  calls: number | null;
  mean_exec_ms: number | null;
  query_text: string | null;
  severity: "critical" | "warning" | "info" | "ok";
  recommendation: string;
}

export function useTempFileStats(limit = 20) {
  return useQuery({
    queryKey: ["db-observability", "temp-file-stats", limit],
    queryFn: async (): Promise<TempFileStat[]> => {
      const { data, error } = await supabase.rpc("get_temp_file_stats", { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as unknown as TempFileStat[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

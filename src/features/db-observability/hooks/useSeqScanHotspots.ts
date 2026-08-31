import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SeqScanHotspot {
  schema_name: string;
  table_name: string;
  live_tuples: number;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  idx_tup_fetch: number;
  seq_ratio: number;
  avg_tuples_per_scan: number;
  table_size_bytes: number;
  severity: "critical" | "warning" | "info";
}

export function useSeqScanHotspots(minLiveTuples = 10000, limit = 20) {
  return useQuery({
    queryKey: ["db-observability", "seq-scan-hotspots", minLiveTuples, limit],
    queryFn: async (): Promise<SeqScanHotspot[]> => {
      const { data, error } = await supabase.rpc("get_seq_scan_hotspots", {
        p_min_live_tuples: minLiveTuples,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SeqScanHotspot[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

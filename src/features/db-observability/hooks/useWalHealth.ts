import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WalHealth {
  db_size_bytes: number;
  wal_size_bytes: number;
  wal_to_db_ratio: number;
  checkpoint_timeout_s: number | null;
  max_wal_size_mb: number | null;
  severity: "critical" | "warning" | "ok";
  recommendation: string;
}

export function useWalHealth() {
  return useQuery({
    queryKey: ["wal-health"],
    queryFn: async (): Promise<WalHealth | null> => {
      const { data, error } = await supabase.rpc("get_wal_health");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as WalHealth | null;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

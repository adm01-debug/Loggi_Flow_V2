import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TransactionHealth {
  total_commits: number;
  total_rollbacks: number;
  rollback_ratio_pct: number;
  deadlocks: number;
  temp_files: number;
  temp_bytes: number;
  stats_since: string;
  hours_since_reset: number;
  rollbacks_per_hour: number;
  severity: "critical" | "warning" | "ok";
  recommendation: string;
}

export function useTransactionHealth() {
  return useQuery({
    queryKey: ["transaction-health"],
    queryFn: async (): Promise<TransactionHealth | null> => {
      const { data, error } = await supabase.rpc("get_transaction_health");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as TransactionHealth | null;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

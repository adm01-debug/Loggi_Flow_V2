import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LockConflict {
  blocked_pid: number;
  blocked_user: string | null;
  blocked_query: string;
  blocked_duration_seconds: number;
  blocking_pid: number;
  blocking_user: string | null;
  blocking_query: string;
  blocking_state: string | null;
  lock_type: string;
  lock_mode: string;
  relation: string;
  severity: "critical" | "warning" | "info";
}

export function useLockConflicts(limit = 50) {
  return useQuery({
    queryKey: ["db-observability", "lock-conflicts", limit],
    queryFn: async (): Promise<LockConflict[]> => {
      const { data, error } = await supabase.rpc("get_lock_conflicts", { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as unknown as LockConflict[];
    },
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });
}

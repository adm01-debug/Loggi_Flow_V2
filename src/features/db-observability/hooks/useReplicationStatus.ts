import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReplicationStatus {
  pid: number;
  usename: string | null;
  application_name: string | null;
  client_addr: string | null;
  state: string | null;
  sync_state: string | null;
  backend_start: string;
  write_lag_bytes: number;
  flush_lag_bytes: number;
  replay_lag_bytes: number;
  total_lag_bytes: number;
  write_lag_seconds: number;
  flush_lag_seconds: number;
  replay_lag_seconds: number;
  severity: "critical" | "warning" | "ok";
}

export function useReplicationStatus() {
  return useQuery({
    queryKey: ["db-observability", "replication-status"],
    queryFn: async (): Promise<ReplicationStatus[]> => {
      const { data, error } = await supabase.rpc("get_replication_status");
      if (error) throw error;
      return (data ?? []) as unknown as ReplicationStatus[];
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

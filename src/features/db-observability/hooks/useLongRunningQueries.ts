import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LongRunningQuery {
  pid: number;
  usename: string | null;
  application_name: string | null;
  client_addr: string | null;
  state: string | null;
  wait_event_type: string | null;
  wait_event: string | null;
  query_start: string;
  duration_seconds: number;
  query: string;
  severity: "critical" | "warning" | "info";
}

export function useLongRunningQueries(minSeconds = 30, limit = 50) {
  return useQuery({
    queryKey: ["db-observability", "long-running", minSeconds, limit],
    queryFn: async (): Promise<LongRunningQuery[]> => {
      const { data, error } = await supabase.rpc("get_long_running_queries", {
        p_min_seconds: minSeconds,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as LongRunningQuery[];
    },
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export function useCancelQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pid, terminate }: { pid: number; terminate?: boolean }) => {
      const { data, error } = await supabase.rpc("cancel_long_running_query", {
        p_pid: pid,
        p_terminate: terminate ?? false,
      });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["db-observability", "long-running"] });
    },
  });
}

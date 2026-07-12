import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveSessionSummary {
  state: string;
  wait_event_type: string;
  session_count: number;
  oldest_session_seconds: number;
  longest_query_seconds: number;
  longest_xact_seconds: number;
  sample_query: string | null;
  severity: "critical" | "warning" | "ok";
}

export function useActiveSessions() {
  return useQuery({
    queryKey: ["db-observability", "active-sessions"],
    queryFn: async (): Promise<ActiveSessionSummary[]> => {
      const { data, error } = await (
        supabase.rpc as unknown as (
          fn: string,
        ) => Promise<{ data: unknown; error: unknown }>
      )("get_active_sessions_summary");
      if (error) throw error as Error;
      return (data ?? []) as ActiveSessionSummary[];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

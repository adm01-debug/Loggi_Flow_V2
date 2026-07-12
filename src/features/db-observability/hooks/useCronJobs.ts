import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CronJobStatus } from "../types";

export function useCronJobs() {
  return useQuery({
    queryKey: ["db-observability", "cron-jobs"],
    queryFn: async (): Promise<CronJobStatus[]> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: unknown; error: unknown }>)("get_cron_jobs_status");
      if (error) throw error as Error;
      return (data ?? []) as CronJobStatus[];
    },
    staleTime: 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MaintenanceWindow {
  rank: number;
  day_of_week: number;
  day_name: string;
  start_hour: number;
  end_hour: number;
  avg_load: number;
  peak_load: number;
  vs_daily_peak_pct: number;
  recommendation: string;
}

export function useMaintenanceWindows(days = 30, windowHours = 2, limit = 3) {
  return useQuery({
    queryKey: ["maintenance-windows", days, windowHours, limit],
    queryFn: async (): Promise<MaintenanceWindow[]> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("get_maintenance_windows", {
        p_days: days,
        p_window_hours: windowHours,
        p_limit: limit,
      });
      if (error) throw error as Error;
      return (data as MaintenanceWindow[] | null) ?? [];
    },
    staleTime: 10 * 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryMetrics } from "../types";

export function useAnalyticsFeature(dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ["analytics-feature", dateRange?.from, dateRange?.to],
    queryFn: async (): Promise<SummaryMetrics> => {
      // Logic for fetching metrics
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        start_date: dateRange?.from.toISOString(),
        end_date: dateRange?.to.toISOString(),
      });

      if (error) throw error;
      return data as SummaryMetrics;
    },
    enabled: !!dateRange,
  });
}

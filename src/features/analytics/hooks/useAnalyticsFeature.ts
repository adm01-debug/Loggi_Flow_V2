import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryMetrics } from "../types";

export function useAnalyticsFeature(dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ["analytics-feature-optimized", dateRange?.from.toISOString(), dateRange?.to.toISOString()],
    queryFn: async (): Promise<SummaryMetrics | null> => {
      const { data, error } = await supabase.rpc('get_monthly_analytics', {
        start_date: dateRange?.from.toISOString() || new Date().toISOString(),
        end_date: dateRange?.to.toISOString() || new Date().toISOString()
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const results = data as Array<{ entregas_count: number | string; custo_total: number | string; sla_atingido: number | string }>;
      const currentMonth = results[results.length - 1];
      const previousMonth = results[results.length - 2];
      
      const growth = previousMonth && Number(previousMonth.entregas_count) > 0
        ? Math.round(((Number(currentMonth.entregas_count) - Number(previousMonth.entregas_count)) / Number(previousMonth.entregas_count)) * 100)
        : 0;

      return {
        totalEntregas: Number(currentMonth.entregas_count),
        entregasGrowth: growth,
        avgCost: Number(currentMonth.entregas_count) > 0 ? Number(currentMonth.custo_total) / Number(currentMonth.entregas_count) : 0,
        onTimeRate: Number(currentMonth.sla_atingido),
        avgDeliveryTime: 24,
      };
    },
    enabled: !!dateRange,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks';
import { subMonths, format, getHours } from 'date-fns';

export interface MonthlyData {
  month: string;
  entregas: number;
  coletas: number;
  custoTotal: number;
  slaAtingido: number;
  ocorrencias: number;
}

export interface DemandForecast {
  date: string;
  actual: number | null;
  predicted: number;
}

export interface HeatmapData {
  hour: number;
  region: string;
  count: number;
  intensity: number;
}

export interface TransportadoraStats {
  id: string;
  nome: string;
  entregas: number;
  sla: number;
  custoMedio: number;
  ocorrencias: number;
  prazoMedio: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function useAnalytics(dateRange?: DateRange) {
  const { user } = useAuth();
  const startDate = dateRange?.from || subMonths(new Date(), 6);
  const endDate = dateRange?.to || new Date();

  // Monthly comparison data - Optimized via RPC
  const { data: monthlyData = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['analytics-monthly-optimized', user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_analytics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      
      if (error) throw error;
      
      return data.map((d: any) => ({
        month: d.month_label,
        entregas: Number(d.entregas_count),
        coletas: Number(d.coletas_count),
        custoTotal: Number(d.custo_total),
        slaAtingido: Number(d.sla_atingido),
        ocorrencias: Number(d.ocorrencias_count),
      })) as MonthlyData[];
    },
    enabled: !!user?.id,
  });

  // Heatmap data - Peaking hours logic remains frontend-side for now, but limited
  const { data: heatmapData = [], isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ['analytics-heatmap-v2', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data: entregas } = await supabase
        .from('entregas')
        .select('endereco_entrega, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .limit(500); // Reduced limit for performance
      
      const patterns: Record<string, Record<number, number>> = {};
      
      const extractState = (address: string) => {
        const stateMatch = address.match(/\b([A-Z]{2})\b/);
        if (stateMatch) return stateMatch[1];
        return 'SP';
      };
      
      entregas?.forEach(e => {
        const state = extractState(e.endereco_entrega);
        const hour = getHours(new Date(e.created_at));
        if (!patterns[state]) patterns[state] = {};
        patterns[state][hour] = (patterns[state][hour] || 0) + 1;
      });
      
      const heatmap: HeatmapData[] = [];
      const maxCount = Math.max(1, ...Object.values(patterns).flatMap(h => Object.values(h)));
      
      Object.entries(patterns).forEach(([region, hours]) => {
        for (let hour = 6; hour <= 20; hour++) {
          const count = hours[hour] || 0;
          heatmap.push({
            hour,
            region,
            count,
            intensity: count / maxCount,
          });
        }
      });
      
      return heatmap;
    },
    enabled: !!user?.id,
  });

  // Simplified summary metrics calculation
  const { data: summaryMetrics, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['analytics-summary-optimized', monthlyData.length],
    queryFn: async () => {
      if (monthlyData.length === 0) return null;
      
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      
      const growth = previousMonth && previousMonth.entregas > 0
        ? Math.round(((currentMonth.entregas - previousMonth.entregas) / previousMonth.entregas) * 100)
        : 0;

      return {
        totalEntregas: currentMonth.entregas,
        entregasGrowth: growth,
        avgCost: currentMonth.entregas > 0 ? currentMonth.custoTotal / currentMonth.entregas : 0,
        onTimeRate: currentMonth.slaAtingido,
        avgDeliveryTime: 24, // Simplified
      };
    },
    enabled: !!user?.id && monthlyData.length > 0,
  });

  return {
    monthlyData,
    heatmapData,
    summaryMetrics,
    isLoading: isLoadingMonthly || isLoadingHeatmap || isLoadingSummary,
  };
}

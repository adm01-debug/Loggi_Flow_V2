import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, parseISO } from 'date-fns';

interface AnalyticsMetrics {
  totalEntregas: number;
  entregasNoPrazo: number;
  taxaSLA: number;
  custoMedio: number;
  tempoMedioEntrega: number;
  volumeTotal: number;
}

interface DailyMetric {
  date: string;
  entregas: number;
  custoTotal: number;
  slaAtingido: number;
}

export function useAnalyticsReal(dateRange?: { start: Date; end: Date }) {
  const start = dateRange?.start || startOfMonth(new Date());
  const end = dateRange?.end || endOfMonth(new Date());

  // Métricas principais do período
  const metricsQuery = useQuery({
    queryKey: ['analytics-metrics', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: entregas, error } = await supabase
        .from('entregas')
        .select('id, created_at, status, custo_frete, tempo_entrega, volume, sla_atingido')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .is('deleted_at', null);

      if (error) throw error;

      const total = entregas?.length || 0;
      const noPrazo = entregas?.filter(e => e.sla_atingido).length || 0;
      const custoTotal = entregas?.reduce((acc, e) => acc + (e.custo_frete || 0), 0) || 0;
      const tempoTotal = entregas?.reduce((acc, e) => acc + (e.tempo_entrega || 0), 0) || 0;
      const volumeTotal = entregas?.reduce((acc, e) => acc + (e.volume || 0), 0) || 0;

      return {
        totalEntregas: total,
        entregasNoPrazo: noPrazo,
        taxaSLA: total > 0 ? (noPrazo / total) * 100 : 0,
        custoMedio: total > 0 ? custoTotal / total : 0,
        tempoMedioEntrega: total > 0 ? tempoTotal / total : 0,
        volumeTotal,
      } as AnalyticsMetrics;
    },
  });

  // Dados diários para gráficos
  const dailyQuery = useQuery({
    queryKey: ['analytics-daily', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: entregas, error } = await supabase
        .from('entregas')
        .select('created_at, custo_frete, sla_atingido')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .is('deleted_at', null);

      if (error) throw error;

      const days = eachDayOfInterval({ start, end });
      const dailyData: DailyMetric[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayEntregas = entregas?.filter(e => e.created_at?.startsWith(dayStr)) || [];
        
        return {
          date: dayStr,
          entregas: dayEntregas.length,
          custoTotal: dayEntregas.reduce((acc, e) => acc + (e.custo_frete || 0), 0),
          slaAtingido: dayEntregas.filter(e => e.sla_atingido).length,
        };
      });

      return dailyData;
    },
  });

  // Comparativo com período anterior
  const comparisonQuery = useQuery({
    queryKey: ['analytics-comparison', format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      const prevStart = subMonths(start, 1);
      const prevEnd = subMonths(end, 1);

      const { data: prevEntregas, error } = await supabase
        .from('entregas')
        .select('id, sla_atingido, custo_frete')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString())
        .is('deleted_at', null);

      if (error) throw error;

      const prevTotal = prevEntregas?.length || 0;
      const prevNoPrazo = prevEntregas?.filter(e => e.sla_atingido).length || 0;
      const prevCusto = prevEntregas?.reduce((acc, e) => acc + (e.custo_frete || 0), 0) || 0;

      return {
        prevTotalEntregas: prevTotal,
        prevTaxaSLA: prevTotal > 0 ? (prevNoPrazo / prevTotal) * 100 : 0,
        prevCustoMedio: prevTotal > 0 ? prevCusto / prevTotal : 0,
      };
    },
  });

  return {
    metrics: metricsQuery.data,
    dailyData: dailyQuery.data || [],
    comparison: comparisonQuery.data,
    isLoading: metricsQuery.isLoading || dailyQuery.isLoading,
    error: metricsQuery.error || dailyQuery.error,
    refetch: () => {
      metricsQuery.refetch();
      dailyQuery.refetch();
      comparisonQuery.refetch();
    },
  };
}

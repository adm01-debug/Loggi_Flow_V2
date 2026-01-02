import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';

interface SLAMetrics {
  taxaGeral: number;
  entregasNoPrazo: number;
  entregasAtrasadas: number;
  totalEntregas: number;
  tempoMedioEntrega: number;
  metaSLA: number;
}

interface SLAByTransportadora {
  transportadora: string;
  taxa: number;
  total: number;
  noPrazo: number;
}

interface SLAByRegiao {
  regiao: string;
  taxa: number;
  total: number;
}

export function useSLAMetricsReal(dateRange?: { start: Date; end: Date }) {
  const start = dateRange?.start || startOfMonth(new Date());
  const end = dateRange?.end || endOfMonth(new Date());
  const metaSLA = 95; // Meta de SLA em %

  // Métricas gerais de SLA
  const metricsQuery = useQuery({
    queryKey: ['sla-metrics-real', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: entregas, error } = await supabase
        .from('entregas')
        .select('id, sla_atingido, tempo_entrega, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'entregue')
        .is('deleted_at', null);

      if (error) throw error;

      const total = entregas?.length || 0;
      const noPrazo = entregas?.filter(e => e.sla_atingido).length || 0;
      const atrasadas = total - noPrazo;
      const tempoTotal = entregas?.reduce((acc, e) => acc + (e.tempo_entrega || 0), 0) || 0;

      return {
        taxaGeral: total > 0 ? (noPrazo / total) * 100 : 100,
        entregasNoPrazo: noPrazo,
        entregasAtrasadas: atrasadas,
        totalEntregas: total,
        tempoMedioEntrega: total > 0 ? tempoTotal / total : 0,
        metaSLA,
      } as SLAMetrics;
    },
  });

  // SLA por transportadora
  const byTransportadoraQuery = useQuery({
    queryKey: ['sla-by-transportadora', format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select('transportadora_id, sla_atingido, transportadoras(nome)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'entregue')
        .is('deleted_at', null);

      if (error) throw error;

      const grouped = (data || []).reduce((acc, item) => {
        const nome = (item as any).transportadoras?.nome || 'Não definida';
        if (!acc[nome]) acc[nome] = { total: 0, noPrazo: 0 };
        acc[nome].total++;
        if (item.sla_atingido) acc[nome].noPrazo++;
        return acc;
      }, {} as Record<string, { total: number; noPrazo: number }>);

      return Object.entries(grouped).map(([transportadora, stats]) => ({
        transportadora,
        taxa: stats.total > 0 ? (stats.noPrazo / stats.total) * 100 : 0,
        total: stats.total,
        noPrazo: stats.noPrazo,
      })) as SLAByTransportadora[];
    },
  });

  // Timeline diária de SLA
  const timelineQuery = useQuery({
    queryKey: ['sla-timeline', format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select('created_at, sla_atingido')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'entregue')
        .is('deleted_at', null);

      if (error) throw error;

      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayEntregas = data?.filter(e => e.created_at?.startsWith(dayStr)) || [];
        const noPrazo = dayEntregas.filter(e => e.sla_atingido).length;
        
        return {
          date: format(day, 'dd/MM'),
          taxa: dayEntregas.length > 0 ? (noPrazo / dayEntregas.length) * 100 : 100,
          total: dayEntregas.length,
          meta: metaSLA,
        };
      });
    },
  });

  return {
    metrics: metricsQuery.data,
    byTransportadora: byTransportadoraQuery.data || [],
    timeline: timelineQuery.data || [],
    isLoading: metricsQuery.isLoading,
    error: metricsQuery.error,
  };
}

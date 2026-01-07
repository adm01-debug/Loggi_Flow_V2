import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval } from 'date-fns';

interface CostMetrics {
  custoTotal: number;
  custoMedioPorEntrega: number;
  custoMedioPorKg: number;
  totalEntregas: number;
  pesoTotal: number;
  variacaoMensal: number;
}

interface CostByTransportadora {
  transportadora: string;
  custo: number;
  entregas: number;
  mediaPorEntrega: number;
}

export function useLogisticsCostsReal(dateRange?: { start: Date; end: Date }) {
  const start = dateRange?.start || startOfMonth(new Date());
  const end = dateRange?.end || endOfMonth(new Date());

  // Métricas de custo - usando valor_frete da tabela entregas
  const metricsQuery = useQuery({
    queryKey: ['costs-metrics-real', format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: entregas, error } = await supabase
        .from('entregas')
        .select('valor_frete')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      // Período anterior para comparação
      const prevStart = subMonths(start, 1);
      const prevEnd = subMonths(end, 1);
      const { data: prevEntregas } = await supabase
        .from('entregas')
        .select('valor_frete')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const custoTotal = entregas?.reduce((acc, e) => acc + (e.valor_frete || 0), 0) || 0;
      const totalEntregas = entregas?.length || 0;

      const custoPrevio = prevEntregas?.reduce((acc, e) => acc + (e.valor_frete || 0), 0) || 0;
      const variacaoMensal = custoPrevio > 0 ? ((custoTotal - custoPrevio) / custoPrevio) * 100 : 0;

      return {
        custoTotal,
        custoMedioPorEntrega: totalEntregas > 0 ? custoTotal / totalEntregas : 0,
        custoMedioPorKg: 0, // Não temos peso na tabela
        totalEntregas,
        pesoTotal: 0,
        variacaoMensal,
      } as CostMetrics;
    },
  });

  // Custo por transportadora
  const byTransportadoraQuery = useQuery({
    queryKey: ['costs-by-transportadora', format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select('valor_frete, transportadora_id, transportadoras(nome_fantasia)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      const grouped = (data || []).reduce((acc, item) => {
        const nome = (item.transportadoras as { nome_fantasia?: string })?.nome_fantasia || 'Não definida';
        if (!acc[nome]) acc[nome] = { custo: 0, entregas: 0 };
        acc[nome].custo += item.valor_frete || 0;
        acc[nome].entregas++;
        return acc;
      }, {} as Record<string, { custo: number; entregas: number }>);

      return Object.entries(grouped)
        .map(([transportadora, stats]) => ({
          transportadora,
          custo: stats.custo,
          entregas: stats.entregas,
          mediaPorEntrega: stats.entregas > 0 ? stats.custo / stats.entregas : 0,
        }))
        .sort((a, b) => b.custo - a.custo) as CostByTransportadora[];
    },
  });

  // Timeline diária de custos
  const timelineQuery = useQuery({
    queryKey: ['costs-timeline', format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select('created_at, valor_frete')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayEntregas = data?.filter(e => e.created_at?.startsWith(dayStr)) || [];
        
        return {
          date: format(day, 'dd/MM'),
          custo: dayEntregas.reduce((acc, e) => acc + (e.valor_frete || 0), 0),
          entregas: dayEntregas.length,
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

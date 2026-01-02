import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

interface DashboardMetrics {
  entregasHoje: number;
  entregasPendentes: number;
  coletasHoje: number;
  coletasPendentes: number;
  taxaSLA: number;
  custoTotalHoje: number;
  motoristasAtivos: number;
  ocorrenciasAbertas: number;
}

interface TrendData {
  date: string;
  entregas: number;
  coletas: number;
  custo: number;
}

export function useDashboardMetricsReal() {
  const hoje = startOfDay(new Date());

  // Métricas principais do dia
  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics-real', format(hoje, 'yyyy-MM-dd')],
    queryFn: async () => {
      const [entregasRes, coletasRes, ocorrenciasRes] = await Promise.all([
        supabase.from('entregas').select('id, status, custo_frete, sla_atingido, created_at').gte('created_at', hoje.toISOString()).is('deleted_at', null),
        supabase.from('coletas').select('id, status, created_at').gte('created_at', hoje.toISOString()).is('deleted_at', null),
        supabase.from('ocorrencias').select('id, status').eq('status', 'aberta').is('deleted_at', null),
      ]);

      const entregas = entregasRes.data || [];
      const coletas = coletasRes.data || [];
      const ocorrencias = ocorrenciasRes.data || [];

      const entregasHoje = entregas.length;
      const entregasPendentes = entregas.filter(e => e.status === 'pendente' || e.status === 'em_transito').length;
      const entregasConcluidas = entregas.filter(e => e.status === 'entregue').length;
      const entregasNoPrazo = entregas.filter(e => e.sla_atingido).length;

      return {
        entregasHoje,
        entregasPendentes,
        coletasHoje: coletas.length,
        coletasPendentes: coletas.filter(c => c.status === 'pendente').length,
        taxaSLA: entregasConcluidas > 0 ? (entregasNoPrazo / entregasConcluidas) * 100 : 100,
        custoTotalHoje: entregas.reduce((acc, e) => acc + (e.custo_frete || 0), 0),
        motoristasAtivos: 0, // Será preenchido via Lalamove
        ocorrenciasAbertas: ocorrencias.length,
      } as DashboardMetrics;
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  // Tendência dos últimos 7 dias
  const trendQuery = useQuery({
    queryKey: ['dashboard-trend-real'],
    queryFn: async () => {
      const seteDiasAtras = subDays(hoje, 7);
      
      const { data: entregas } = await supabase
        .from('entregas')
        .select('created_at, custo_frete')
        .gte('created_at', seteDiasAtras.toISOString())
        .is('deleted_at', null);

      const { data: coletas } = await supabase
        .from('coletas')
        .select('created_at')
        .gte('created_at', seteDiasAtras.toISOString())
        .is('deleted_at', null);

      const trendData: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const dia = subDays(hoje, i);
        const diaStr = format(dia, 'yyyy-MM-dd');
        
        const entregasDia = entregas?.filter(e => e.created_at?.startsWith(diaStr)) || [];
        const coletasDia = coletas?.filter(c => c.created_at?.startsWith(diaStr)) || [];
        
        trendData.push({
          date: format(dia, 'dd/MM'),
          entregas: entregasDia.length,
          coletas: coletasDia.length,
          custo: entregasDia.reduce((acc, e) => acc + (e.custo_frete || 0), 0),
        });
      }

      return trendData;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    metrics: metricsQuery.data,
    trend: trendQuery.data || [],
    isLoading: metricsQuery.isLoading,
    error: metricsQuery.error,
    refetch: metricsQuery.refetch,
  };
}

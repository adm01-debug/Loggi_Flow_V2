import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';

export interface PeriodKPIs {
  period: string;
  periodLabel: string;
  totalEntregas: number;
  entregasNoPrazo: number;
  slaRate: number;
  custoTotal: number;
  custoMedio: number;
  ocorrencias: number;
  ocorrenciaRate: number;
  tempoMedioEntrega: number;
  totalColetas: number;
  coletasNoPrazo: number;
}

export interface KPIComparison {
  current: PeriodKPIs;
  previous: PeriodKPIs;
  changes: {
    entregas: number;
    sla: number;
    custo: number;
    ocorrencias: number;
    tempoEntrega: number;
  };
}

export const useKPIBenchmark = (periodsBack: number = 6) => {
  return useQuery({
    queryKey: ['kpi-benchmark', periodsBack],
    queryFn: async () => {
      const periods: PeriodKPIs[] = [];
      
      for (let i = 0; i < periodsBack; i++) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        // Fetch entregas for this period
        const { data: entregas } = await supabase
          .from('entregas')
          .select('id, status, data_entrega_efetiva, previsao_entrega, valor_frete, data_despacho')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        // Fetch coletas for this period
        const { data: coletas } = await supabase
          .from('coletas')
          .select('id, status, data_efetiva_coleta, data_prevista_coleta')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        // Fetch ocorrencias for this period
        const { data: ocorrencias } = await supabase
          .from('ocorrencias')
          .select('id')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        // Calculate metrics
        const entregasData = entregas || [];
        const coletasData = coletas || [];
        const ocorrenciasData = ocorrencias || [];
        
        const totalEntregas = entregasData.length;
        const entregasEntregues = entregasData.filter(e => e.status === 'entregue' || e.status === 'finalizado');
        
        let entregasNoPrazo = 0;
        let totalDiasEntrega = 0;
        let entregasComTempo = 0;
        
        entregasEntregues.forEach(e => {
          if (e.data_entrega_efetiva && e.previsao_entrega) {
            const efetiva = new Date(e.data_entrega_efetiva);
            const prevista = new Date(e.previsao_entrega);
            if (efetiva <= prevista) {
              entregasNoPrazo++;
            }
          }
          
          if (e.data_entrega_efetiva && e.data_despacho) {
            const efetiva = new Date(e.data_entrega_efetiva);
            const despacho = new Date(e.data_despacho);
            const dias = Math.ceil((efetiva.getTime() - despacho.getTime()) / (1000 * 60 * 60 * 24));
            if (dias > 0) {
              totalDiasEntrega += dias;
              entregasComTempo++;
            }
          }
        });

        const custoTotal = entregasData.reduce((sum, e) => sum + (e.valor_frete || 0), 0);
        
        const totalColetas = coletasData.length;
        const coletasFinalizadas = coletasData.filter(c => 
          c.status === 'finalizada' || c.status === 'conferencia_ok'
        );
        let coletasNoPrazo = 0;
        coletasFinalizadas.forEach(c => {
          if (c.data_efetiva_coleta && c.data_prevista_coleta) {
            const efetiva = new Date(c.data_efetiva_coleta);
            const prevista = new Date(c.data_prevista_coleta);
            if (efetiva <= prevista) {
              coletasNoPrazo++;
            }
          }
        });

        periods.push({
          period: format(date, 'yyyy-MM'),
          periodLabel: format(date, 'MMM/yy'),
          totalEntregas,
          entregasNoPrazo,
          slaRate: totalEntregas > 0 ? (entregasNoPrazo / totalEntregas) * 100 : 0,
          custoTotal,
          custoMedio: totalEntregas > 0 ? custoTotal / totalEntregas : 0,
          ocorrencias: ocorrenciasData.length,
          ocorrenciaRate: totalEntregas > 0 ? (ocorrenciasData.length / totalEntregas) * 100 : 0,
          tempoMedioEntrega: entregasComTempo > 0 ? totalDiasEntrega / entregasComTempo : 0,
          totalColetas,
          coletasNoPrazo,
        });
      }

      // Sort by period ascending
      periods.sort((a, b) => a.period.localeCompare(b.period));

      // Calculate comparison between last two periods
      let comparison: KPIComparison | null = null;
      if (periods.length >= 2) {
        const current = periods[periods.length - 1];
        const previous = periods[periods.length - 2];
        
        comparison = {
          current,
          previous,
          changes: {
            entregas: previous.totalEntregas > 0 
              ? ((current.totalEntregas - previous.totalEntregas) / previous.totalEntregas) * 100 
              : 0,
            sla: current.slaRate - previous.slaRate,
            custo: previous.custoMedio > 0 
              ? ((current.custoMedio - previous.custoMedio) / previous.custoMedio) * 100 
              : 0,
            ocorrencias: previous.ocorrencias > 0 
              ? ((current.ocorrencias - previous.ocorrencias) / previous.ocorrencias) * 100 
              : 0,
            tempoEntrega: previous.tempoMedioEntrega > 0 
              ? ((current.tempoMedioEntrega - previous.tempoMedioEntrega) / previous.tempoMedioEntrega) * 100 
              : 0,
          },
        };
      }

      return { periods, comparison };
    },
    staleTime: 5 * 60 * 1000,
  });
};

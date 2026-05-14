import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/queryConfig";
import { differenceInHours, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

export interface DashboardMetrics {
  totalColetas: number;
  coletasPendentes: number;
  coletasEmTransito: number;
  coletasFinalizadas: number;
  coletasComDivergencia: number;
  totalEntregas: number;
  entregasPendentes: number;
  entregasEmTransito: number;
  entregasFinalizadas: number;
  entregasComOcorrencia: number;
  otifRate: number;
  tempoMedioColeta: number;
  taxaOcorrencias: number;
  taxaEntregaNoPrazo: number;
  alertasCriticos: number;
  coletasAtrasadas: number;
  divergenciasAltas: number;
  lastSync: string;
  totalVolume: number;
  valorTotalFrete: number;
}

export interface RecentAlert {
  id: string;
  type: 'coleta_atrasada' | 'divergencia' | 'ocorrencia' | 'prazo_critico' | 'ia_previsao';
  message: string;
  severity: 'warning' | 'error' | 'info';
  createdAt: string;
  entityId?: string;
  entityType?: 'coleta' | 'entrega';
}

export function useDashboardMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.analytics.dashboard,
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data: coletas, error: coletasError } = await supabase
        .from('coletas')
        .select('id, status, divergencia_percentual, data_prevista_coleta, created_at, data_efetiva_coleta, qtd_volumes');
      
      if (coletasError) throw coletasError;
      
      const { data: entregas, error: entregasError } = await supabase
        .from('entregas')
        .select('id, status, previsao_entrega, data_entrega_efetiva, created_at, valor_frete');
      
      if (entregasError) throw entregasError;
      
      const { data: ocorrencias, error: ocorrenciasError } = await supabase
        .from('ocorrencias')
        .select('id, resolvida')
        .eq('resolvida', false);
      
      if (ocorrenciasError) throw ocorrenciasError;
      
      const totalColetas = coletas?.length || 0;
      const coletasPendentes = coletas?.filter(c => 
        ['aguardando_liberacao', 'solicitada'].includes(c.status)
      ).length || 0;
      const coletasEmTransito = coletas?.filter(c => c.status === 'em_transito').length || 0;
      const coletasFinalizadas = coletas?.filter(c => c.status === 'finalizada').length || 0;
      const coletasComDivergencia = coletas?.filter(c => 
        c.divergencia_percentual && c.divergencia_percentual > 5
      ).length || 0;
      
      const totalEntregas = entregas?.length || 0;
      const entregasPendentes = entregas?.filter(e => 
        ['aguardando_producao', 'pronto_despacho', 'cotacao_frete', 'nf_emitida'].includes(e.status)
      ).length || 0;
      const entregasEmTransito = entregas?.filter(e => 
        ['despachado', 'em_transito', 'saiu_entrega'].includes(e.status)
      ).length || 0;
      const entregasFinalizadas = entregas?.filter(e => 
        ['entregue', 'finalizado'].includes(e.status)
      ).length || 0;
      const entregasComOcorrencia = entregas?.filter(e => e.status === 'ocorrencia').length || 0;
      
      const entregasComPrazo = entregas?.filter(e => 
        e.previsao_entrega && e.data_entrega_efetiva
      ) || [];
      
      const entregasNoPrazo = entregasComPrazo.filter(e => {
        const previsao = parseISO(e.previsao_entrega!);
        const efetiva = parseISO(e.data_entrega_efetiva!);
        return efetiva <= previsao;
      });
      
      const taxaEntregaNoPrazo = entregasComPrazo.length > 0 
        ? (entregasNoPrazo.length / entregasComPrazo.length) * 100 
        : 100;
      
      const taxaOcorrencias = totalEntregas > 0 
        ? (entregasComOcorrencia / totalEntregas) * 100 
        : 0;
      
      // OTIF definition: On Time In Full (No delays AND no occurrences)
      const entregasOTIF = entregasComPrazo.filter(e => {
        const previsao = parseISO(e.previsao_entrega!);
        const efetiva = parseISO(e.data_entrega_efetiva!);
        const semOcorrencia = e.status !== 'ocorrencia';
        return efetiva <= previsao && semOcorrencia;
      });

      const otifRate = entregasComPrazo.length > 0 
        ? (entregasOTIF.length / entregasComPrazo.length) * 100 
        : 100;
      
      const now = new Date();
      const coletasAtrasadas = coletas?.filter(c => {
        if (['finalizada', 'conferencia_ok'].includes(c.status)) return false;
        const created = new Date(c.created_at);
        const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return hoursElapsed > 48;
      }).length || 0;
      
      const alertasCriticos = coletasAtrasadas + coletasComDivergencia + (ocorrencias?.length || 0);
      
      const totalVolume = coletas?.reduce((acc, c) => acc + (c.qtd_volumes || 0), 0) || 0;
      const valorTotalFrete = entregas?.reduce((acc, e) => acc + (Number(e.valor_frete) || 0), 0) || 0;

      return {
        totalColetas,
        coletasPendentes,
        coletasEmTransito,
        coletasFinalizadas,
        coletasComDivergencia,
        totalEntregas,
        entregasPendentes,
        entregasEmTransito,
        entregasFinalizadas,
        entregasComOcorrencia,
        otifRate: Math.round(otifRate * 10) / 10,
        tempoMedioColeta: (() => {
          const finished = coletas?.filter(c => c.data_efetiva_coleta && c.created_at) || [];
          if (finished.length === 0) return 36;
          const totalHours = finished.reduce((acc, c) => {
            return acc + Math.max(0, differenceInHours(parseISO(c.data_efetiva_coleta!), parseISO(c.created_at)));
          }, 0);
          return Math.round(totalHours / finished.length);
        })(),
        taxaOcorrencias: Math.round(taxaOcorrencias * 10) / 10,
        taxaEntregaNoPrazo: Math.round(taxaEntregaNoPrazo * 10) / 10,
        alertasCriticos,
        coletasAtrasadas,
        divergenciasAltas: coletasComDivergencia,
        lastSync: new Date().toISOString(),
        totalVolume,
        valorTotalFrete,
      };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
    refetchInterval: QUERY_REFETCH_INTERVAL.DASHBOARD,
    enabled: !!user?.id,
  });
}

export function useRecentAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recent-alerts', user?.id],
    queryFn: async (): Promise<RecentAlert[]> => {
      const alerts: RecentAlert[] = [];
      const now = new Date();
      
      const { data: coletas } = await supabase
        .from('coletas')
        .select('id, numero_coleta, status, divergencia_percentual, created_at')
        .not('status', 'in', '("finalizada","conferencia_ok")');
      
      coletas?.forEach(coleta => {
        const created = new Date(coleta.created_at);
        const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        
        if (hoursElapsed > 48) {
          alerts.push({
            id: `coleta-atrasada-${coleta.id}`,
            type: 'coleta_atrasada',
            message: `Coleta ${coleta.numero_coleta} está há mais de 48h sem finalizar`,
            severity: 'error',
            createdAt: coleta.created_at,
            entityId: coleta.id,
            entityType: 'coleta',
          });
        } else if (hoursElapsed > 36) {
          alerts.push({
            id: `coleta-prazo-${coleta.id}`,
            type: 'prazo_critico',
            message: `Coleta ${coleta.numero_coleta} próxima do prazo crítico`,
            severity: 'warning',
            createdAt: coleta.created_at,
            entityId: coleta.id,
            entityType: 'coleta',
          });
        }
        
        if (coleta.divergencia_percentual && coleta.divergencia_percentual > 5) {
          alerts.push({
            id: `divergencia-${coleta.id}`,
            type: 'divergencia',
            message: `Coleta ${coleta.numero_coleta} com divergência de ${coleta.divergencia_percentual}%`,
            severity: coleta.divergencia_percentual > 10 ? 'error' : 'warning',
            createdAt: coleta.created_at,
            entityId: coleta.id,
            entityType: 'coleta',
          });
        }
      });
      
      const { data: entregas } = await supabase
        .from('entregas')
        .select('id, numero_entrega, status, created_at')
        .eq('status', 'ocorrencia');
      
      entregas?.forEach(entrega => {
        alerts.push({
          id: `ocorrencia-${entrega.id}`,
          type: 'ocorrencia',
          message: `Entrega ${entrega.numero_entrega} com ocorrência pendente`,
          severity: 'error',
          createdAt: entrega.created_at,
          entityId: entrega.id,
          entityType: 'entrega',
        });
      });
      
      // Integration with Delay Predictions (IA)
      try {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        const { data: predictionsData } = await supabase
          .from('ai_delay_predictions')
          .select('*')
          .gte('analyzed_at', sixHoursAgo)
          .in('risco', ['alto', 'critico'])
          .limit(5);

        predictionsData?.forEach((pred: any) => {
          const p = pred.prediction_data;
          alerts.push({
            id: `ia-pred-${pred.id}`,
            type: 'ia_previsao',
            message: `IA prevê ${p.probabilidade_atraso}% de atraso em ${p.numero} (${p.tipo})`,
            severity: p.risco === 'critico' ? 'error' : 'warning',
            createdAt: pred.analyzed_at,
            entityId: pred.entity_id,
            entityType: pred.entity_type,
          });
        });
      } catch (e) {
        // Silent fail for predictions
      }
      
      return alerts.sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }).slice(0, 10);
    },
    staleTime: QUERY_STALE_TIME.DYNAMIC,
    refetchInterval: QUERY_REFETCH_INTERVAL.NOTIFICATIONS,
    enabled: !!user?.id,
  });
}

export function useTransportadoraPerformance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transportadora-performance', user?.id],
    queryFn: async () => {
      const { data: transportadoras, error } = await (supabase
        .from('transportadoras')
        .select('id, nome_fantasia, score_performance, prazo_medio_dias, homologada') as any)
        .eq('homologada', true)
        .order('score_performance', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return transportadoras || [];
    },
    staleTime: QUERY_STALE_TIME.STATIC,
    enabled: !!user?.id,
  });
}

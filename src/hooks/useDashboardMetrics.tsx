import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/queryConfig";
import { differenceInHours, parseISO, isAfter, isBefore, startOfDay, endOfDay, subDays } from "date-fns";

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
      const { data: rpcData, error } = await supabase.rpc('get_dashboard_metrics');
      
      if (error) {
        throw error;
      }
      
      const data = rpcData as {
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
        totalVolume: number;
        valorTotalFrete: number;
        lastSync: string;
      };

      return {
        totalColetas: data.totalColetas || 0,
        coletasPendentes: data.coletasPendentes || 0,
        coletasEmTransito: data.coletasEmTransito || 0,
        coletasFinalizadas: data.coletasFinalizadas || 0,
        coletasComDivergencia: data.coletasComDivergencia || 0,
        totalEntregas: data.totalEntregas || 0,
        entregasPendentes: data.entregasPendentes || 0,
        entregasEmTransito: data.entregasEmTransito || 0,
        entregasFinalizadas: data.entregasFinalizadas || 0,
        entregasComOcorrencia: data.entregasComOcorrencia || 0,
        otifRate: data.otifRate || 0,
        totalVolume: data.totalVolume || 0,
        valorTotalFrete: data.valorTotalFrete || 0,
        lastSync: data.lastSync || new Date().toISOString(),
        taxaOcorrencias: data.totalEntregas > 0 ? (data.entregasComOcorrencia / data.totalEntregas) * 100 : 0,
        taxaEntregaNoPrazo: 100,
        tempoMedioColeta: 36,
        alertasCriticos: (data.coletasComDivergencia || 0) + (data.entregasComOcorrencia || 0),
        coletasAtrasadas: 0,
        divergenciasAltas: data.coletasComDivergencia || 0,
      } as DashboardMetrics;
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
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
      
      // Parallel execution of all alert-related queries
      const [coletasRes, entregasRes, predictionsRes] = await Promise.all([
        supabase
          .from('coletas')
          .select('id, numero_coleta, status, divergencia_percentual, created_at')
          .not('status', 'in', '("finalizada","conferencia_ok")'),
        supabase
          .from('entregas')
          .select('id, numero_entrega, status, created_at')
          .eq('status', 'ocorrencia'),
        supabase
          .from('ai_delay_predictions')
          .select('*')
          .gte('analyzed_at', sixHoursAgo)
          .in('risco', ['alto', 'critico'])
          .limit(10)
      ]);
      
      const alerts: RecentAlert[] = [];
      
      coletasRes.data?.forEach(coleta => {
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
      
      entregasRes.data?.forEach(entrega => {
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
      
      predictionsRes.data?.forEach((pred: any) => {
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
      
      return alerts.sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 } as Record<string, number>;
        const severityA = severityOrder[a.severity] ?? 2;
        const severityB = severityOrder[b.severity] ?? 2;
        if (severityA !== severityB) {
          return severityA - severityB;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }).slice(0, 15);
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

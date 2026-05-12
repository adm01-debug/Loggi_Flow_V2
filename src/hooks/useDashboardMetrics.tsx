import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/queryConfig";

export interface DashboardMetrics {
  // Coletas
  totalColetas: number;
  coletasPendentes: number;
  coletasEmTransito: number;
  coletasFinalizadas: number;
  coletasComDivergencia: number;
  
  // Entregas
  totalEntregas: number;
  entregasPendentes: number;
  entregasEmTransito: number;
  entregasFinalizadas: number;
  entregasComOcorrencia: number;
  
  // Performance
  otifRate: number;
  tempoMedioColetaSP: number;
  taxaOcorrencias: number;
  taxaEntregaNoPrazo: number;
  
  // Alertas
  alertasCriticos: number;
  coletasAtrasadas: number;
  divergenciasAltas: number;
}

export interface RecentAlert {
  id: string;
  type: 'coleta_atrasada' | 'divergencia' | 'ocorrencia' | 'prazo_critico';
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
      // Buscar coletas
      const { data: coletas, error: coletasError } = await supabase
        .from('coletas')
        .select('id, status, divergencia_percentual, data_prevista_coleta, created_at');
      
      if (coletasError) throw coletasError;
      
      // Buscar entregas
      const { data: entregas, error: entregasError } = await supabase
        .from('entregas')
        .select('id, status, previsao_entrega, data_entrega_efetiva, created_at');
      
      if (entregasError) throw entregasError;
      
      // Buscar ocorrências não resolvidas
      const { data: ocorrencias, error: ocorrenciasError } = await supabase
        .from('ocorrencias')
        .select('id, resolvida')
        .eq('resolvida', false);
      
      if (ocorrenciasError) throw ocorrenciasError;
      
      // Calcular métricas de coletas
      const totalColetas = coletas?.length || 0;
      const coletasPendentes = coletas?.filter(c => 
        ['aguardando_liberacao', 'solicitada'].includes(c.status)
      ).length || 0;
      const coletasEmTransito = coletas?.filter(c => c.status === 'em_transito').length || 0;
      const coletasFinalizadas = coletas?.filter(c => c.status === 'finalizada').length || 0;
      const coletasComDivergencia = coletas?.filter(c => 
        c.divergencia_percentual && c.divergencia_percentual > 5
      ).length || 0;
      
      // Calcular métricas de entregas
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
      
      // Calcular taxas de performance
      const entregasComPrazo = entregas?.filter(e => 
        e.previsao_entrega && e.data_entrega_efetiva
      ) || [];
      
      const entregasNoPrazo = entregasComPrazo.filter(e => {
        const previsao = new Date(e.previsao_entrega!);
        const efetiva = new Date(e.data_entrega_efetiva!);
        return efetiva <= previsao;
      });
      
      const taxaEntregaNoPrazo = entregasComPrazo.length > 0 
        ? (entregasNoPrazo.length / entregasComPrazo.length) * 100 
        : 100;
      
      const taxaOcorrencias = totalEntregas > 0 
        ? (entregasComOcorrencia / totalEntregas) * 100 
        : 0;
      
      // OTIF simplificado (On-Time In-Full)
      const otifRate = totalEntregas > 0 
        ? Math.max(0, taxaEntregaNoPrazo - taxaOcorrencias) 
        : 100;
      
      // Coletas atrasadas (mais de 48h desde a criação sem finalizar)
      const now = new Date();
      const coletasAtrasadas = coletas?.filter(c => {
        if (['finalizada', 'conferencia_ok'].includes(c.status)) return false;
        const created = new Date(c.created_at);
        const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return hoursElapsed > 48;
      }).length || 0;
      
      // Divergências altas (> 5%)
      const divergenciasAltas = coletasComDivergencia;
      
      // Alertas críticos = coletas atrasadas + divergências + ocorrências não resolvidas
      const alertasCriticos = coletasAtrasadas + divergenciasAltas + (ocorrencias?.length || 0);
      
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
        tempoMedioColetaSP: 36, // Placeholder - seria calculado com dados reais
        taxaOcorrencias: Math.round(taxaOcorrencias * 10) / 10,
        taxaEntregaNoPrazo: Math.round(taxaEntregaNoPrazo * 10) / 10,
        alertasCriticos,
        coletasAtrasadas,
        divergenciasAltas,
      };
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
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
      
      // Buscar coletas com problemas
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
      
      // Buscar entregas com ocorrências
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
      
      // Ordenar por severidade e data
      return alerts.sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }).slice(0, 10);
    },
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60 * 1,
    enabled: !!user?.id,
  });
}

export function useTransportadoraPerformance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transportadora-performance', user?.id],
    queryFn: async () => {
      const { data: transportadoras, error } = await supabase
        .from('transportadoras')
        .select('id, nome_fantasia, score_performance, prazo_medio_dias, homologada')
        .eq('homologada', true)
        .order('score_performance', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return transportadoras || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.id,
  });
}

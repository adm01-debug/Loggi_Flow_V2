import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/hooks';
import { useAuth } from '@/hooks';

// ==========================================
// NORMALIZED TRACKING INTERFACES
// ==========================================

export interface TrackingEvent {
  id: string;
  timestamp: string;
  status: string;
  statusLabel: string;
  description: string;
  source: 'lalamove' | 'rodonaves' | 'interno' | 'manual';
  location?: { lat: number; lng: number; city?: string; uf?: string };
  severity: 'info' | 'success' | 'warning' | 'error';
}

export interface UnifiedShipment {
  id: string;
  numero: string;
  tipo: 'entrega' | 'coleta';
  status: string;
  statusLabel: string;
  statusColor: string;
  origem: string;
  destino: string;
  transportadora: string;
  transportadoraId: string | null;
  previsao: string | null;
  dataEfetiva: string | null;
  codigoRastreamento: string | null;
  nfRemessa: string | null;
  valorFrete: number | null;
  cliente: string | null;
  atrasado: boolean;
  diasAtraso: number;
  events: TrackingEvent[];
  coordinates?: { lat: number; lng: number };
}

export type TrackingFilter = 'all' | 'atrasados' | 'em_transito' | 'entregue' | 'pendentes';

const STATUS_LABELS: Record<string, string> = {
  aguardando_producao: 'Aguardando Produção',
  pronto_despacho: 'Pronto p/ Despacho',
  despachado: 'Despachado',
  em_transito: 'Em Trânsito',
  saiu_entrega: 'Saiu p/ Entrega',
  entregue: 'Entregue',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido',
  aguardando_liberacao: 'Aguardando Liberação',
  solicitada: 'Solicitada',
  em_rota: 'Em Rota',
  coletado: 'Coletado',
  recebido: 'Recebido',
  recebido_divergencia: 'Recebido c/ Divergência',
};

const STATUS_COLORS: Record<string, string> = {
  aguardando_producao: 'hsl(var(--muted-foreground))',
  pronto_despacho: 'hsl(var(--warning))',
  despachado: 'hsl(var(--info))',
  em_transito: 'hsl(var(--primary))',
  saiu_entrega: 'hsl(var(--accent-foreground))',
  entregue: 'hsl(var(--success))',
  finalizado: 'hsl(var(--success))',
  cancelado: 'hsl(var(--destructive))',
  devolvido: 'hsl(var(--destructive))',
  aguardando_liberacao: 'hsl(var(--muted-foreground))',
  solicitada: 'hsl(var(--warning))',
  em_rota: 'hsl(var(--primary))',
  coletado: 'hsl(var(--success))',
  recebido: 'hsl(var(--success))',
  recebido_divergencia: 'hsl(var(--destructive))',
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'hsl(var(--muted-foreground))';
}

function isAtrasado(previsao: string | null, status: string, dataEfetiva: string | null): boolean {
  if (!previsao) return false;
  if (['entregue', 'finalizado', 'cancelado', 'devolvido', 'recebido'].includes(status)) {
    if (dataEfetiva) return new Date(dataEfetiva) > new Date(previsao);
    return false;
  }
  return new Date() > new Date(previsao);
}

function calcDiasAtraso(previsao: string | null, status: string): number {
  if (!previsao || ['entregue', 'finalizado', 'cancelado'].includes(status)) return 0;
  const diff = Math.ceil((Date.now() - new Date(previsao).getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// ==========================================
// HOOK
// ==========================================

export function useUnifiedTracking() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TrackingFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch entregas with transportadora info
  const { data: entregas, isLoading: loadingEntregas, refetch: refetchEntregas } = useQuery({
    queryKey: ['unified-tracking-entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id, numero_entrega, status, endereco_entrega, previsao_entrega,
          data_entrega_efetiva, data_despacho, codigo_rastreamento, nf_remessa,
          valor_frete, latitude, longitude, transportadora_id,
          transportadora:transportadoras(nome_fantasia),
          cliente:clientes(razao_social)
        `)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch coletas with fornecedor info
  const { data: coletas, isLoading: loadingColetas, refetch: refetchColetas } = useQuery({
    queryKey: ['unified-tracking-coletas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coletas')
        .select(`
          id, numero_coleta, status, endereco_coleta, data_prevista_coleta,
          data_efetiva_coleta, codigo_rastreamento, tipo_coleta, transportadora_id,
          transportadora:transportadoras!fk_coletas_transportadora(nome_fantasia),
          fornecedor:fornecedores!fk_coletas_fornecedor(razao_social)
        `)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Realtime subscriptions
  useRealtime({ table: 'entregas', onInsert: () => refetchEntregas(), onUpdate: () => refetchEntregas() });
  useRealtime({ table: 'coletas', onInsert: () => refetchColetas(), onUpdate: () => refetchColetas() });

  // Normalize all data into UnifiedShipment[]
  const shipments: UnifiedShipment[] = useMemo(() => {
    const result: UnifiedShipment[] = [];

    // Normalize entregas
    (entregas || []).forEach((e: any) => {
      const t = e.transportadora as { nome_fantasia: string } | null;
      const c = e.cliente as { razao_social: string } | null;
      const atrasado = isAtrasado(e.previsao_entrega, e.status, e.data_entrega_efetiva);

      result.push({
        id: e.id,
        numero: e.numero_entrega,
        tipo: 'entrega',
        status: e.status,
        statusLabel: getStatusLabel(e.status),
        statusColor: getStatusColor(e.status),
        origem: 'Promobrindes SP',
        destino: e.endereco_entrega,
        transportadora: t?.nome_fantasia || 'N/A',
        transportadoraId: e.transportadora_id,
        previsao: e.previsao_entrega,
        dataEfetiva: e.data_entrega_efetiva,
        codigoRastreamento: e.codigo_rastreamento,
        nfRemessa: e.nf_remessa,
        valorFrete: e.valor_frete,
        cliente: c?.razao_social || null,
        atrasado,
        diasAtraso: calcDiasAtraso(e.previsao_entrega, e.status),
        events: [],
        coordinates: e.latitude && e.longitude ? { lat: e.latitude, lng: e.longitude } : undefined,
      });
    });

    // Normalize coletas
    (coletas || []).forEach((c: any) => {
      const t = c.transportadora as { nome_fantasia: string } | null;
      const f = c.fornecedor as { razao_social: string } | null;
      const atrasado = isAtrasado(c.data_prevista_coleta, c.status, c.data_efetiva_coleta);

      result.push({
        id: c.id,
        numero: c.numero_coleta,
        tipo: 'coleta',
        status: c.status,
        statusLabel: getStatusLabel(c.status),
        statusColor: getStatusColor(c.status),
        origem: c.endereco_coleta,
        destino: 'Promobrindes SP',
        transportadora: t?.nome_fantasia || (c.tipo_coleta === 'lalamove' ? 'Lalamove' : 'N/A'),
        transportadoraId: c.transportadora_id,
        previsao: c.data_prevista_coleta,
        dataEfetiva: c.data_efetiva_coleta,
        codigoRastreamento: c.codigo_rastreamento,
        nfRemessa: null,
        valorFrete: null,
        cliente: f?.razao_social || null,
        atrasado,
        diasAtraso: calcDiasAtraso(c.data_prevista_coleta, c.status),
        events: [],
        coordinates: undefined,
      });
    });

    return result;
  }, [entregas, coletas]);

  // Apply filters
  const filteredShipments = useMemo(() => {
    let filtered = shipments;

    // Status filter
    switch (filter) {
      case 'atrasados':
        filtered = filtered.filter(s => s.atrasado);
        break;
      case 'em_transito':
        filtered = filtered.filter(s => ['em_transito', 'despachado', 'saiu_entrega', 'em_rota'].includes(s.status));
        break;
      case 'entregue':
        filtered = filtered.filter(s => ['entregue', 'finalizado', 'recebido', 'coletado'].includes(s.status));
        break;
      case 'pendentes':
        filtered = filtered.filter(s => ['aguardando_producao', 'pronto_despacho', 'aguardando_liberacao', 'solicitada'].includes(s.status));
        break;
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.numero.toLowerCase().includes(term) ||
        s.destino.toLowerCase().includes(term) ||
        s.transportadora.toLowerCase().includes(term) ||
        s.cliente?.toLowerCase().includes(term) ||
        s.codigoRastreamento?.toLowerCase().includes(term) ||
        s.nfRemessa?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [shipments, filter, searchTerm]);

  // Summary stats
  const summary = useMemo(() => ({
    total: shipments.length,
    emTransito: shipments.filter(s => ['em_transito', 'despachado', 'saiu_entrega', 'em_rota'].includes(s.status)).length,
    atrasados: shipments.filter(s => s.atrasado).length,
    entregues: shipments.filter(s => ['entregue', 'finalizado', 'recebido', 'coletado'].includes(s.status)).length,
    pendentes: shipments.filter(s => ['aguardando_producao', 'pronto_despacho', 'aguardando_liberacao', 'solicitada'].includes(s.status)).length,
    custoTotal: shipments.reduce((sum, s) => sum + (s.valorFrete || 0), 0),
  }), [shipments]);

  const refetch = useCallback(() => {
    refetchEntregas();
    refetchColetas();
  }, [refetchEntregas, refetchColetas]);

  return {
    shipments: filteredShipments,
    allShipments: shipments,
    summary,
    isLoading: loadingEntregas || loadingColetas,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    refetch,
    getStatusLabel,
    getStatusColor,
  };
}

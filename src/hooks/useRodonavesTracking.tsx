import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackingEvent {
  CodigoOcorrencia: number;
  DescricaoOcorrencia: string;
  DataOcorrencia: string;
  HoraOcorrencia: string;
  Filial: string;
  Cidade: string;
  UF: string;
}

interface TrackingResult {
  success: boolean;
  data?: {
    Tracking: TrackingEvent[];
    NfNumero: string;
    NfSerie: string;
  };
  error?: string;
}

interface QuotationParams {
  cepOrigem: string;
  cepDestino: string;
  peso: number;
  volumes: number;
  valorMercadoria: number;
  cnpjRemetente: string;
}

interface QuotationResult {
  success: boolean;
  data?: {
    Valor: number;
    PrazoEntrega: number;
    ValorFrete: number;
    ValorPedagio: number;
    ValorSeguro: number;
    ValorTaxas: number;
  };
  error?: string;
}

interface DeadlineResult {
  success: boolean;
  data?: {
    Prazo: number;
    DataPrevistaEntrega: string;
  };
  error?: string;
}

/**
 * Rodonaves tracking status code descriptions.
 * Maps numeric codes to human-readable PT-BR descriptions.
 */
export const RODONAVES_STATUS_MAP: Record<number, { label: string; severity: 'info' | 'success' | 'warning' | 'error' }> = {
  0: { label: 'Transporte Iniciado', severity: 'info' },
  1: { label: 'Entrega Realizada', severity: 'success' },
  2: { label: 'Entrega Fora do Prazo', severity: 'warning' },
  3: { label: 'Recusa - Falta Pedido', severity: 'error' },
  6: { label: 'Endereço Não Localizado', severity: 'error' },
  14: { label: 'Mercadoria Sinistrada', severity: 'error' },
  19: { label: 'Reentrega Solicitada', severity: 'warning' },
  20: { label: 'Entrega Prejudicada por Horário', severity: 'warning' },
  21: { label: 'Estabelecimento Fechado', severity: 'warning' },
  23: { label: 'Extravio em Trânsito', severity: 'error' },
  24: { label: 'Mercadoria Reentregue', severity: 'success' },
  25: { label: 'Devolvida à Origem', severity: 'warning' },
  27: { label: 'Roubo de Carga', severity: 'error' },
  29: { label: 'Cliente Retirou na Transportadora', severity: 'success' },
  37: { label: 'Em Trânsito para Redespacho', severity: 'info' },
  39: { label: 'Em Trânsito', severity: 'info' },
  43: { label: 'Saiu para Entrega', severity: 'info' },
  44: { label: 'Recebida na Filial Destino', severity: 'info' },
  45: { label: 'Em Transferência', severity: 'info' },
  46: { label: 'Mercadoria Despachada', severity: 'info' },
  47: { label: 'Mercadoria Coletada', severity: 'info' },
  58: { label: 'CT-e Emitido', severity: 'info' },
};

async function invokeRodonaves(action: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('rodonaves-api', {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Erro na API Rodonaves');
  return data;
}

export function useRodonavesTracking() {
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);

  // Track a single shipment
  const trackMutation = useMutation({
    mutationFn: async (params: { nfNumero: string; nfSerie: string; cnpjRemetente: string }) => {
      return invokeRodonaves('track', params);
    },
    onSuccess: (data) => {
      setTrackingResult(data);
      toast.success('Rastreamento atualizado!');
    },
    onError: (err: Error) => {
      toast.error(`Erro no rastreamento: ${err.message}`);
    },
  });

  // Get delivery proof
  const deliveryProofMutation = useMutation({
    mutationFn: async (params: { nfNumero: string; nfSerie: string; cnpjRemetente: string }) => {
      return invokeRodonaves('delivery-proof', params);
    },
    onSuccess: () => toast.success('Comprovante obtido!'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  // Simulate quotation
  const quotationMutation = useMutation({
    mutationFn: async (params: QuotationParams) => {
      return invokeRodonaves('quotation', params);
    },
    onSuccess: () => toast.success('Cotação Rodonaves recebida!'),
    onError: (err: Error) => toast.error(`Erro na cotação: ${err.message}`),
  });

  // Get delivery deadline
  const deadlineMutation = useMutation({
    mutationFn: async (params: { cepOrigem: string; cepDestino: string }) => {
      return invokeRodonaves('deadline', params);
    },
    onSuccess: () => toast.success('Prazo calculado!'),
    onError: (err: Error) => toast.error(`Erro no prazo: ${err.message}`),
  });

  // Sync all Rodonaves shipments
  const syncMutation = useMutation({
    mutationFn: async (cnpjRemetente?: string) => {
      return invokeRodonaves('sync-tracking', { cnpjRemetente });
    },
    onSuccess: (data) => {
      const synced = data?.data?.synced || 0;
      toast.success(`${synced} entrega(s) atualizada(s) via Rodonaves`);
    },
    onError: (err: Error) => toast.error(`Erro na sincronização: ${err.message}`),
  });

  return {
    // Tracking
    track: trackMutation.mutate,
    trackAsync: trackMutation.mutateAsync,
    isTracking: trackMutation.isPending,
    trackingResult,

    // Delivery proof
    getDeliveryProof: deliveryProofMutation.mutate,
    deliveryProof: deliveryProofMutation.data,
    isLoadingProof: deliveryProofMutation.isPending,

    // Quotation
    getQuotation: quotationMutation.mutate,
    getQuotationAsync: quotationMutation.mutateAsync,
    quotationResult: quotationMutation.data as QuotationResult | undefined,
    isQuoting: quotationMutation.isPending,

    // Deadline
    getDeadline: deadlineMutation.mutate,
    deadlineResult: deadlineMutation.data as DeadlineResult | undefined,
    isLoadingDeadline: deadlineMutation.isPending,

    // Sync
    syncAll: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncResult: syncMutation.data,
  };
}

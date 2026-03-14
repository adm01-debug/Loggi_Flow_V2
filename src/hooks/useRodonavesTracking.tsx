import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  cnpjRemetente?: string;
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

async function invokeRodonaves(action: string, params: object) {
  const { data, error } = await supabase.functions.invoke('rodonaves-api', {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Erro na API Rodonaves');
  return data;
}

export function useRodonavesTracking() {
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);

  // Track a single shipment (GET /api/v1/tracking)
  const trackMutation = useMutation({
    mutationFn: async (params: {
      nfNumero?: string;
      cnpjRemetente?: string;
      invoiceKey?: string;
      protocolNumber?: string;
    }) => invokeRodonaves('track', params),
    onSuccess: (data) => {
      setTrackingResult(data);
      toast.success('Rastreamento atualizado!');
    },
    onError: (err: Error) => toast.error(`Erro no rastreamento: ${err.message}`),
  });

  // Batch tracking (GET /api/v1/tracking/batch)
  const trackBatchMutation = useMutation({
    mutationFn: async (params: {
      cnpjRemetente: string;
      startDate: string;
      endDate: string;
      page?: number;
      amountByPage?: number;
    }) => invokeRodonaves('track-batch', params),
    onSuccess: () => toast.success('Rastreamento em lote recebido!'),
    onError: (err: Error) => toast.error(`Erro no lote: ${err.message}`),
  });

  // Tracking steps (GET /api/v1/tracking/trackingSteps)
  const trackingStepsMutation = useMutation({
    mutationFn: async (params: {
      nfNumero?: string;
      cnpjRemetente?: string;
      invoiceKey?: string;
      protocolNumber?: string;
    }) => invokeRodonaves('tracking-steps', params),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  // Delivery proof (GET /api/v1/deliveryreceipt)
  const deliveryProofMutation = useMutation({
    mutationFn: async (params: {
      nfNumero?: string;
      cnpjRemetente?: string;
      invoiceKey?: string;
      protocolNumber?: string;
    }) => invokeRodonaves('delivery-proof', params),
    onSuccess: () => toast.success('Comprovante obtido!'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  // Delivery info (GET /api/v1/deliveryreceipt/deliveryInformation)
  const deliveryInfoMutation = useMutation({
    mutationFn: async (params: {
      nfNumero?: string;
      cnpjRemetente?: string;
      protocolNumber?: string;
    }) => invokeRodonaves('delivery-info', params),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  // Orders paginated (GET /api/v1/orders/ordersbydaterangepagination)
  const ordersMutation = useMutation({
    mutationFn: async (params: {
      cnpjRemetente: string;
      startDate: string;
      endDate: string;
      customerType?: number;
      page?: number;
      amountByPage?: number;
      invoiceNumber?: string;
    }) => invokeRodonaves('orders', params),
    onError: (err: Error) => toast.error(`Erro nos pedidos: ${err.message}`),
  });

  // Quotation (POST /api/v1/simula-cotacao)
  const quotationMutation = useMutation({
    mutationFn: async (params: QuotationParams) => invokeRodonaves('quotation', params),
    onSuccess: () => toast.success('Cotação Rodonaves recebida!'),
    onError: (err: Error) => toast.error(`Erro na cotação: ${err.message}`),
  });

  // Cubage factor (GET /api/v1/peso-cubado)
  const cubageMutation = useMutation({
    mutationFn: async (params: { cnpjRemetente: string; companyId?: string }) =>
      invokeRodonaves('cubage-factor', params),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  // Deadline (POST /api/v1/busca-prazo)
  const deadlineMutation = useMutation({
    mutationFn: async (params: { cepOrigem: string; cepDestino: string }) =>
      invokeRodonaves('deadline', params),
    onSuccess: () => toast.success('Prazo calculado!'),
    onError: (err: Error) => toast.error(`Erro no prazo: ${err.message}`),
  });

  // Sync all Rodonaves shipments
  const syncMutation = useMutation({
    mutationFn: async (cnpjRemetente?: string) =>
      invokeRodonaves('sync-tracking', { cnpjRemetente }),
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

    // Batch tracking
    trackBatch: trackBatchMutation.mutate,
    trackBatchAsync: trackBatchMutation.mutateAsync,
    isTrackingBatch: trackBatchMutation.isPending,
    batchResult: trackBatchMutation.data,

    // Tracking steps
    getTrackingSteps: trackingStepsMutation.mutate,
    trackingSteps: trackingStepsMutation.data,
    isLoadingSteps: trackingStepsMutation.isPending,

    // Delivery proof
    getDeliveryProof: deliveryProofMutation.mutate,
    deliveryProof: deliveryProofMutation.data,
    isLoadingProof: deliveryProofMutation.isPending,

    // Delivery info
    getDeliveryInfo: deliveryInfoMutation.mutate,
    deliveryInfo: deliveryInfoMutation.data,
    isLoadingDeliveryInfo: deliveryInfoMutation.isPending,

    // Orders
    getOrders: ordersMutation.mutate,
    getOrdersAsync: ordersMutation.mutateAsync,
    ordersResult: ordersMutation.data,
    isLoadingOrders: ordersMutation.isPending,

    // Quotation
    getQuotation: quotationMutation.mutate,
    getQuotationAsync: quotationMutation.mutateAsync,
    quotationResult: quotationMutation.data as QuotationResult | undefined,
    isQuoting: quotationMutation.isPending,

    // Cubage factor
    getCubageFactor: cubageMutation.mutate,
    cubageResult: cubageMutation.data,

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

/* eslint-disable max-lines */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { extractFallbackNotice, fallbackNoticeMessage } from '@/lib/rodonaves';
import { toast } from 'sonner';

// ==========================================
// TYPES
// ==========================================

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

  // 403 da RTE e trocado por rota alternativa no gateway; o operador precisa
  // saber que o dado veio de outra rota antes de decidir com base nele.
  const notice = extractFallbackNotice(data);
  if (notice) {
    toast.warning('Dado obtido por rota alternativa', {
      id: `rte-fallback-${notice.route}`,
      description: fallbackNoticeMessage(notice),
    });
  }

  return data;
}

// Helper to create a standard mutation
function useRodonavesMutation<TParams>(
  action: string,
  successMsg?: string,
  errorPrefix = 'Erro',
) {
  return useMutation({
    mutationFn: async (params: TParams) => invokeRodonaves(action, params as object),
    onSuccess: successMsg ? () => toast.success(successMsg) : undefined,
    onError: (err: Error) => toast.error(`${errorPrefix}: ${err.message}`),
  });
}

export function useRodonavesTracking() {
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);

  // ===== TRACKING =====
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

  const trackBatchMutation = useRodonavesMutation<{
    cnpjRemetente: string; startDate: string; endDate: string;
    page?: number; amountByPage?: number;
  }>('track-batch', 'Rastreamento em lote recebido!', 'Erro no lote');

  const trackBatchPaginatedMutation = useRodonavesMutation<{
    cnpjRemetente: string; startDate: string; endDate: string;
    page?: number; amountByPage?: number; operationType?: number;
  }>('track-batch-paginated', 'Rastreamento paginado recebido!');

  const trackBatchByParamsMutation = useRodonavesMutation<{
    cnpjRemetente: string; cTeNumber?: number; nfNumero?: string; protocolNumber?: string; page?: number;
  }>('track-batch-by-params');

  const trackingStepsMutation = useRodonavesMutation<{
    nfNumero?: string; cnpjRemetente?: string; invoiceKey?: string; protocolNumber?: string;
  }>('tracking-steps');

  const trackBatchByOccurrenceMutation = useRodonavesMutation<{
    cnpjRemetente: string; startDate: string; endDate: string;
    page?: number; amountByPage?: number;
  }>('track-batch-by-occurrence');

  // ===== DELIVERY RECEIPTS =====
  const deliveryProofMutation = useRodonavesMutation<{
    nfNumero?: string; cnpjRemetente?: string; invoiceKey?: string; protocolNumber?: string;
  }>('delivery-proof', 'Comprovante obtido!');

  const deliveryProofHQMutation = useRodonavesMutation<{
    nfNumero?: string; cnpjRemetente?: string; invoiceKey?: string; protocolNumber?: string;
  }>('delivery-proof-hq', 'Comprovante HD obtido!');

  const deliveryInfoMutation = useRodonavesMutation<{
    nfNumero?: string; cnpjRemetente?: string; protocolNumber?: string;
  }>('delivery-info');

  const deliveryReceiptBatchMutation = useRodonavesMutation<{
    body: { taxIdRegistration?: string; invoiceNumber?: string[]; invoiceKey?: string[]; protocolNumber?: string[]; cTeNumber?: number[] };
  }>('delivery-receipt-batch', 'Download em lote iniciado!');

  const deliveryReceiptByProtocolsMutation = useRodonavesMutation<{
    protocols: string[];
  }>('delivery-receipt-by-protocols');

  // ===== OCCURRENCE RECEIPTS (NEW) =====
  const occurrenceReceiptMutation = useRodonavesMutation<{
    billOfLadingId: number; occurrenceCode: string; loadImageContent?: boolean;
  }>('occurrence-receipt', 'Comprovante de ocorrência obtido!');

  const occurrenceReceiptListMutation = useRodonavesMutation<{
    billOfLadingId: number; occurrenceCode: string; loadImageContent?: boolean;
  }>('occurrence-receipt-list');

  const occurrenceReceiptImageMutation = useRodonavesMutation<{
    billOfLadingId: number; occurrenceCode: string; removeImageUrlExpire?: boolean;
  }>('occurrence-receipt-image');

  // ===== ORDERS =====
  const ordersMutation = useRodonavesMutation<{
    cnpjRemetente: string; startDate: string; endDate: string;
    customerType?: number; page?: number; amountByPage?: number; invoiceNumber?: string;
  }>('orders');

  // ===== QUOTATION =====
  const quotationMutation = useRodonavesMutation<QuotationParams>('quotation', 'Cotação Rodonaves recebida!', 'Erro na cotação');

  const generateQuotationMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('generate-quotation', 'Cotação gerada no TMS!');
  const generateFirstQuotationMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('generate-first-quotation', 'Primeira cotação gerada!');
  const updateQuotationContactMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('update-quotation-contact', 'Contato atualizado!');
  const digitalCarrierQuotationMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('digital-carrier-quotation', 'Cotação digital gerada!');
  const updateQuotationInvoiceKeyMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('update-quotation-invoice-key', 'Chave NF-e atualizada!');

  const cubageMutation = useRodonavesMutation<{ cnpjRemetente: string; companyId?: string }>('cubage-factor');
  const deadlineMutation = useRodonavesMutation<{ cepOrigem: string; cepDestino: string }>('deadline', 'Prazo calculado!', 'Erro no prazo');

  // ===== CUSTOMER (ALL NEW) =====
  const saveCustomerMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('customer-save', 'Cliente cadastrado na RTE!');
  const getCustomerByIdMutation = useRodonavesMutation<{ id: number }>('customer-get-by-id');
  const listCustomersMutation = useRodonavesMutation<{ lastChangedDate: string; page?: number; amountByPage?: number }>('customer-list');
  const getCustomerByTaxIdMutation = useRodonavesMutation<{ taxIdRegistration: string; page?: number }>('customer-get-by-taxid');
  const searchCustomerMutation = useRodonavesMutation<{ key?: string; description?: string; page?: number }>('customer-search');
  const searchCustomerFullMutation = useRodonavesMutation<{ key?: string; description?: string; page?: number }>('customer-search-full');
  const listAddressesMutation = useRodonavesMutation<{ taxIdRegistration: string }>('address-list');
  const createAddressMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('address-create', 'Endereço criado!');
  const updateAddressMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('address-update', 'Endereço atualizado!');
  const deleteAddressMutation = useRodonavesMutation<{ id: number }>('address-delete', 'Endereço removido!');
  const updatePersonMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('person-update', 'Pessoa atualizada!');

  // ===== PICKUP (ALL NEW) =====
  const getPickupMutation = useRodonavesMutation<{ id: number }>('pickup-get');
  const createPickupMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('pickup-create', 'Coleta criada na RTE!');
  const createPickupByQuotationMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('pickup-create-by-quotation', 'Coleta criada por cotação!');
  const availableDatesMutation = useRodonavesMutation<{ protocol: number }>('pickup-available-dates');
  const availableDatesByParamsMutation = useRodonavesMutation<Record<string, unknown>>('pickup-available-dates-by-params');
  const getPickupByProtocolMutation = useRodonavesMutation<{ protocol: number }>('pickup-get-by-protocol');
  const reschedulePickupMutation = useRodonavesMutation<{ protocol: number; pickupDate: string }>('pickup-reschedule', 'Coleta reagendada!');
  const cancelPickupMutation = useRodonavesMutation<{ protocol: number }>('pickup-cancel', 'Coleta cancelada!');
  const resendExpressMutation = useRodonavesMutation<{ id: number }>('pickup-resend-express', 'Coleta Express reenviada!');
  const pickupRescheduleOrFinalizeMutation = useRodonavesMutation<Record<string, unknown>>('pickup-reschedule-or-finalize');
  const automaticPickupMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('pickup-automatic', 'Coleta automática gerada!');

  // ===== SELFATTENDANCE (ALL NEW) =====
  const citySearchMutation = useRodonavesMutation<{ description: string; uf?: string }>('city-search');
  const cityByZipCodeMutation = useRodonavesMutation<{ zipCode: string }>('city-by-zipcode');
  const addressByZipCodeMutation = useRodonavesMutation<{ zipCode: string }>('address-by-zipcode');
  const trackingStepsBotMutation = useRodonavesMutation<Record<string, unknown>>('tracking-steps-bot');
  const trackingLastStepsBotMutation = useRodonavesMutation<Record<string, unknown>>('tracking-last-steps-bot');
  const unitDataMutation = useRodonavesMutation<{ unitId?: number }>('unit-data');
  const unitCalendarMutation = useRodonavesMutation<{ protocol: number }>('unit-calendar');
  const selfAttendanceQuotationMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('self-attendance-quotation');
  const selfAttendanceDeliveryTimeMutation = useRodonavesMutation<{ body: Record<string, unknown> }>('self-attendance-delivery-time');
  const validateCustomerQuotationMutation = useRodonavesMutation<{ taxId: string; origin?: string }>('validate-customer-quotation');

  // ===== SYNC =====
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (cnpjRemetente?: string) =>
      invokeRodonaves('sync-tracking', { cnpjRemetente }),
    onSuccess: (data) => {
      const synced = data?.data?.synced || 0;
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      toast.success(`${synced} entrega(s) atualizada(s) via Rodonaves`);
    },
    onError: (err: Error) => {
      toast.error(`Falha ao sincronizar com Rodonaves: ${err.message}`);
    },
  });

  const syncAll = async (cnpjRemetente?: string) => {
    const loader = toast.loading("Sincronizando com Rodonaves...");
    try {
      await syncMutation.mutateAsync(cnpjRemetente);
      toast.dismiss(loader);
    } catch {
      toast.dismiss(loader);
    }
  };

  return {
    // ===== TRACKING =====
    track: trackMutation.mutate,
    trackAsync: trackMutation.mutateAsync,
    isTracking: trackMutation.isPending,
    trackingResult,

    trackBatch: trackBatchMutation.mutate,
    trackBatchAsync: trackBatchMutation.mutateAsync,
    isTrackingBatch: trackBatchMutation.isPending,
    batchResult: trackBatchMutation.data,

    trackBatchPaginated: trackBatchPaginatedMutation.mutate,
    trackBatchPaginatedResult: trackBatchPaginatedMutation.data,

    trackBatchByParams: trackBatchByParamsMutation.mutate,
    trackBatchByParamsResult: trackBatchByParamsMutation.data,

    getTrackingSteps: trackingStepsMutation.mutate,
    trackingSteps: trackingStepsMutation.data,
    isLoadingSteps: trackingStepsMutation.isPending,

    trackBatchByOccurrence: trackBatchByOccurrenceMutation.mutate,
    batchByOccurrenceResult: trackBatchByOccurrenceMutation.data,

    // ===== DELIVERY RECEIPTS =====
    getDeliveryProof: deliveryProofMutation.mutate,
    deliveryProof: deliveryProofMutation.data,
    isLoadingProof: deliveryProofMutation.isPending,

    getDeliveryProofHQ: deliveryProofHQMutation.mutate,
    deliveryProofHQ: deliveryProofHQMutation.data,

    getDeliveryInfo: deliveryInfoMutation.mutate,
    deliveryInfo: deliveryInfoMutation.data,
    isLoadingDeliveryInfo: deliveryInfoMutation.isPending,

    getDeliveryReceiptBatch: deliveryReceiptBatchMutation.mutate,
    deliveryReceiptBatchResult: deliveryReceiptBatchMutation.data,

    getDeliveryReceiptByProtocols: deliveryReceiptByProtocolsMutation.mutate,

    // ===== OCCURRENCE RECEIPTS =====
    getOccurrenceReceipt: occurrenceReceiptMutation.mutate,
    occurrenceReceipt: occurrenceReceiptMutation.data,

    getOccurrenceReceiptList: occurrenceReceiptListMutation.mutate,
    occurrenceReceiptList: occurrenceReceiptListMutation.data,

    getOccurrenceReceiptImage: occurrenceReceiptImageMutation.mutate,
    occurrenceReceiptImage: occurrenceReceiptImageMutation.data,

    // ===== ORDERS =====
    getOrders: ordersMutation.mutate,
    getOrdersAsync: ordersMutation.mutateAsync,
    ordersResult: ordersMutation.data,
    isLoadingOrders: ordersMutation.isPending,

    // ===== QUOTATION =====
    getQuotation: quotationMutation.mutate,
    getQuotationAsync: quotationMutation.mutateAsync,
    quotationResult: quotationMutation.data as QuotationResult | undefined,
    isQuoting: quotationMutation.isPending,

    generateQuotation: generateQuotationMutation.mutate,
    generateFirstQuotation: generateFirstQuotationMutation.mutate,
    updateQuotationContact: updateQuotationContactMutation.mutate,
    digitalCarrierQuotation: digitalCarrierQuotationMutation.mutate,
    updateQuotationInvoiceKey: updateQuotationInvoiceKeyMutation.mutate,

    getCubageFactor: cubageMutation.mutate,
    cubageResult: cubageMutation.data,

    getDeadline: deadlineMutation.mutate,
    deadlineResult: deadlineMutation.data as DeadlineResult | undefined,
    isLoadingDeadline: deadlineMutation.isPending,

    // ===== CUSTOMER =====
    saveCustomer: saveCustomerMutation.mutate,
    getCustomerById: getCustomerByIdMutation.mutate,
    listCustomers: listCustomersMutation.mutate,
    getCustomerByTaxId: getCustomerByTaxIdMutation.mutate,
    searchCustomer: searchCustomerMutation.mutate,
    searchCustomerFull: searchCustomerFullMutation.mutate,
    customerResult: getCustomerByIdMutation.data,
    customerSearchResult: searchCustomerMutation.data,

    listAddresses: listAddressesMutation.mutate,
    createAddress: createAddressMutation.mutate,
    updateAddress: updateAddressMutation.mutate,
    deleteAddress: deleteAddressMutation.mutate,
    addressesResult: listAddressesMutation.data,

    updatePerson: updatePersonMutation.mutate,

    // ===== PICKUP =====
    getPickup: getPickupMutation.mutate,
    pickupResult: getPickupMutation.data,

    createPickup: createPickupMutation.mutate,
    isCreatingPickup: createPickupMutation.isPending,

    createPickupByQuotation: createPickupByQuotationMutation.mutate,

    getAvailablePickupDates: availableDatesMutation.mutate,
    availableDatesResult: availableDatesMutation.data,

    getAvailableDatesByParams: availableDatesByParamsMutation.mutate,

    getPickupByProtocol: getPickupByProtocolMutation.mutate,

    reschedulePickup: reschedulePickupMutation.mutate,
    isRescheduling: reschedulePickupMutation.isPending,

    cancelPickup: cancelPickupMutation.mutate,
    isCanceling: cancelPickupMutation.isPending,

    resendExpressPickup: resendExpressMutation.mutate,

    pickupRescheduleOrFinalize: pickupRescheduleOrFinalizeMutation.mutate,

    generateAutomaticPickup: automaticPickupMutation.mutate,

    // ===== SELFATTENDANCE =====
    searchCity: citySearchMutation.mutate,
    citySearchResult: citySearchMutation.data,

    getCityByZipCode: cityByZipCodeMutation.mutate,
    cityByZipCodeResult: cityByZipCodeMutation.data,

    getAddressByZipCode: addressByZipCodeMutation.mutate,
    addressByZipCodeResult: addressByZipCodeMutation.data,

    getTrackingStepsBot: trackingStepsBotMutation.mutate,
    trackingStepsBotResult: trackingStepsBotMutation.data,

    getTrackingLastStepsBot: trackingLastStepsBotMutation.mutate,

    getUnitData: unitDataMutation.mutate,
    unitDataResult: unitDataMutation.data,

    getUnitCalendar: unitCalendarMutation.mutate,
    unitCalendarResult: unitCalendarMutation.data,

    selfAttendanceQuotation: selfAttendanceQuotationMutation.mutate,
    selfAttendanceDeliveryTime: selfAttendanceDeliveryTimeMutation.mutate,
    validateCustomerForQuotation: validateCustomerQuotationMutation.mutate,

    // ===== SYNC =====
    syncAll,
    isSyncing: syncMutation.isPending,
    syncResult: syncMutation.data,
  };
}

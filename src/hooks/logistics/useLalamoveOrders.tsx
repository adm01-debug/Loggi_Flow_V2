import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LalamoveStop {
  lat: number;
  lng: number;
  address: string;
}

interface LalamoveQuotationResult {
  quotationId: string;
  priceBreakdown: {
    total: string;
    currency: string;
  };
  expiresAt: string;
}

interface LalamoveOrderResult {
  orderId: string;
  status: string;
}

export function useLalamoveOrders() {
  // Get a quotation for a delivery
  const getQuotation = useMutation({
    mutationFn: async (params: { vehicleType?: string; stops: LalamoveStop[] }) => {
      const { data, error } = await supabase.functions.invoke('lalamove-api', {
        body: {
          path: '/quotations',
          method: 'POST',
          vehicleType: params.vehicleType || 'MOTORCYCLE',
          stops: params.stops,
        },
      });
      if (error) throw error;
      return data as LalamoveQuotationResult;
    },
    onError: (e: Error) => toast.error(`Erro na cotação Lalamove: ${e.message}`),
  });

  // Create an order
  const createOrder = useMutation({
    mutationFn: async (orderData: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('lalamove-api', {
        body: {
          path: '/orders',
          method: 'POST',
          ...orderData,
        },
      });
      if (error) throw error;
      return data as LalamoveOrderResult;
    },
    onSuccess: (data) => toast.success(`Pedido Lalamove criado: ${data.orderId}`),
    onError: (e: Error) => toast.error(`Erro ao criar pedido: ${e.message}`),
  });

  // Get order details
  const getOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('lalamove-api', {
        body: {
          path: `/orders/${orderId}`,
          method: 'GET',
        },
      });
      if (error) throw error;
      return data;
    },
    onError: (e: Error) => toast.error(`Erro ao buscar pedido: ${e.message}`),
  });

  // Cancel an order
  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('lalamove-api', {
        body: {
          path: `/orders/${orderId}/cancel`,
          method: 'PUT',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Pedido Lalamove cancelado'),
    onError: (e: Error) => toast.error(`Erro ao cancelar: ${e.message}`),
  });

  return {
    getQuotation,
    createOrder,
    getOrder,
    cancelOrder,
  };
}

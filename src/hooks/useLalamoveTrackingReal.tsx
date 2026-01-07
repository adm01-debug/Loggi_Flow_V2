import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LalamoveOrder {
  orderId: string;
  status: string;
  driverName: string | null;
  driverPhone: string | null;
  vehicleType: string;
  plateNumber: string | null;
  currentLocation: { lat: number; lng: number } | null;
  estimatedArrival: string | null;
  stops: LalamoveStop[];
}

interface LalamoveStop {
  stopId: string;
  address: string;
  name: string;
  phone: string;
  status: 'pending' | 'arrived' | 'completed';
  completedAt: string | null;
}

interface LalamoveQuote {
  totalFee: string;
  currency: string;
  estimatedDuration: number;
}

// Configuração da API Lalamove (via Edge Function ou proxy)
const LALAMOVE_API_BASE = '/api/lalamove';

export function useLalamoveTrackingReal(orderId: string | null) {
  // Tracking de pedido via API
  const trackingQuery = useQuery({
    queryKey: ['lalamove-tracking', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // Buscar da API Lalamove via Edge Function
      const response = await fetch(`${LALAMOVE_API_BASE}/orders/${orderId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Erro ao buscar pedido Lalamove');
      
      const data = await response.json();
      return data as LalamoveOrder;
    },
    enabled: !!orderId,
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  // Listar alertas de rastreamento
  const alertsQuery = useQuery({
    queryKey: ['lalamove-alerts', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('rastreamento_alertas')
        .select('*')
        .eq('lalamove_order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });

  return {
    order: trackingQuery.data,
    alerts: alertsQuery.data || [],
    isLoading: trackingQuery.isLoading,
    isRefetching: trackingQuery.isRefetching,
    error: trackingQuery.error,
    refetch: trackingQuery.refetch,
  };
}

// Hook para criar pedidos Lalamove
export function useLalamoveOrders() {
  // Cotação
  const quoteMutation = useMutation({
    mutationFn: async (params: { stops: { lat: number; lng: number; address: string }[]; vehicleType: string }) => {
      const response = await fetch(`${LALAMOVE_API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error('Erro na cotação');
      return response.json() as Promise<LalamoveQuote>;
    },
  });

  // Criar pedido
  const createOrderMutation = useMutation({
    mutationFn: async (params: { quotationId: string; senderStop: unknown; recipientStops: unknown[] }) => {
      const response = await fetch(`${LALAMOVE_API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error('Erro ao criar pedido');
      return response.json();
    },
  });

  // Cancelar pedido
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`${LALAMOVE_API_BASE}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Erro ao cancelar pedido');
    },
  });

  return {
    getQuote: quoteMutation.mutateAsync,
    createOrder: createOrderMutation.mutateAsync,
    cancelOrder: cancelOrderMutation.mutate,
    isQuoting: quoteMutation.isPending,
    isCreating: createOrderMutation.isPending,
  };
}

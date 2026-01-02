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
  // Tracking de pedido
  const trackingQuery = useQuery({
    queryKey: ['lalamove-tracking', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // Primeiro, tentar buscar do Supabase (cache local)
      const { data: cached } = await supabase
        .from('lalamove_orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

      // Se cache válido (menos de 30s), retornar
      if (cached && new Date(cached.updated_at).getTime() > Date.now() - 30000) {
        return cached as LalamoveOrder;
      }

      // Buscar da API Lalamove via Edge Function
      const response = await fetch(`${LALAMOVE_API_BASE}/orders/${orderId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Erro ao buscar pedido Lalamove');
      
      const data = await response.json();

      // Salvar/atualizar cache
      await supabase.from('lalamove_orders').upsert({
        order_id: orderId,
        status: data.status,
        driver_name: data.driverName,
        driver_phone: data.driverPhone,
        plate_number: data.plateNumber,
        current_lat: data.currentLocation?.lat,
        current_lng: data.currentLocation?.lng,
        updated_at: new Date().toISOString(),
      });

      return data as LalamoveOrder;
    },
    enabled: !!orderId,
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  // Listar pedidos ativos
  const activeOrdersQuery = useQuery({
    queryKey: ['lalamove-active-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lalamove_orders')
        .select('*')
        .not('status', 'in', '("COMPLETED","CANCELLED","EXPIRED")')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  return {
    order: trackingQuery.data,
    activeOrders: activeOrdersQuery.data || [],
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
    mutationFn: async (params: { quotationId: string; senderStop: any; recipientStops: any[] }) => {
      const response = await fetch(`${LALAMOVE_API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error('Erro ao criar pedido');
      
      const data = await response.json();

      // Salvar no Supabase
      await supabase.from('lalamove_orders').insert({
        order_id: data.orderId,
        status: 'ASSIGNING_DRIVER',
        created_at: new Date().toISOString(),
      });

      return data;
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

      await supabase.from('lalamove_orders').update({ status: 'CANCELLED' }).eq('order_id', orderId);
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

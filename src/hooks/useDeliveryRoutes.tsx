import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryRoute {
  id: string;
  numero_entrega: string;
  status: string;
  endereco_entrega: string;
  previsao_entrega: string | null;
  data_entrega_efetiva: string | null;
  transportadora: {
    id: string;
    nome_fantasia: string;
  } | null;
  cliente: {
    id: string;
    nome_fantasia: string | null;
    razao_social: string;
    cidade: string | null;
    estado: string | null;
  } | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Mock coordinates for Brazilian states (centro aproximado)
const estadoCoordenadas: Record<string, { lat: number; lng: number }> = {
  'SP': { lat: -23.5505, lng: -46.6333 },
  'RJ': { lat: -22.9068, lng: -43.1729 },
  'MG': { lat: -19.9167, lng: -43.9345 },
  'GO': { lat: -16.6869, lng: -49.2648 },
  'BA': { lat: -12.9714, lng: -38.5014 },
  'PR': { lat: -25.4297, lng: -49.2711 },
  'SC': { lat: -27.5954, lng: -48.5480 },
  'RS': { lat: -30.0346, lng: -51.2177 },
  'PE': { lat: -8.0476, lng: -34.8770 },
  'CE': { lat: -3.7172, lng: -38.5433 },
  'PA': { lat: -1.4558, lng: -48.4902 },
  'AM': { lat: -3.1190, lng: -60.0217 },
  'MT': { lat: -15.6010, lng: -56.0974 },
  'MS': { lat: -20.4697, lng: -54.6201 },
  'DF': { lat: -15.8267, lng: -47.9218 },
  'ES': { lat: -20.3155, lng: -40.3128 },
  'PB': { lat: -7.1195, lng: -34.8450 },
  'RN': { lat: -5.7945, lng: -35.2110 },
  'AL': { lat: -9.6498, lng: -35.7089 },
  'SE': { lat: -10.9472, lng: -37.0731 },
  'PI': { lat: -5.0920, lng: -42.8038 },
  'MA': { lat: -2.5387, lng: -44.2826 },
  'TO': { lat: -10.1753, lng: -48.2982 },
  'RO': { lat: -8.7612, lng: -63.9039 },
  'AC': { lat: -9.9754, lng: -67.8249 },
  'AP': { lat: 0.0349, lng: -51.0694 },
  'RR': { lat: 2.8235, lng: -60.6758 },
};

// Origin point (empresa em São Paulo)
export const ORIGIN_COORDINATES = { lat: -23.5505, lng: -46.6333 };

const getCoordinatesFromEstado = (estado: string | null): { lat: number; lng: number } | null => {
  if (!estado) return null;
  const uf = estado.toUpperCase().trim();
  return estadoCoordenadas[uf] || null;
};

// Add some randomness to avoid overlapping markers
const addRandomOffset = (coords: { lat: number; lng: number }): { lat: number; lng: number } => {
  return {
    lat: coords.lat + (Math.random() - 0.5) * 0.5,
    lng: coords.lng + (Math.random() - 0.5) * 0.5,
  };
};

export const useDeliveryRoutes = () => {
  return useQuery({
    queryKey: ['delivery-routes'],
    queryFn: async (): Promise<DeliveryRoute[]> => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id,
          numero_entrega,
          status,
          endereco_entrega,
          previsao_entrega,
          data_entrega_efetiva,
          transportadora:transportadoras(id, nome_fantasia),
          cliente:clientes(id, nome_fantasia, razao_social, cidade, estado)
        `)
        .not('status', 'in', '("entregue","finalizado")')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add coordinates based on estado
      return (data || []).map((entrega: any) => {
        const estado = entrega.cliente?.estado;
        const baseCoords = getCoordinatesFromEstado(estado);
        
        return {
          ...entrega,
          coordinates: baseCoords ? addRandomOffset(baseCoords) : null,
        };
      });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'aguardando_producao':
      return '#6B7280'; // gray
    case 'pronto_despacho':
      return '#F59E0B'; // amber
    case 'cotacao_frete':
      return '#8B5CF6'; // violet
    case 'nf_emitida':
      return '#3B82F6'; // blue
    case 'despachado':
      return '#10B981'; // emerald
    case 'em_transito':
      return '#06B6D4'; // cyan
    case 'saiu_entrega':
      return '#22C55E'; // green
    case 'ocorrencia':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'aguardando_producao': 'Aguardando Produção',
    'pronto_despacho': 'Pronto p/ Despacho',
    'cotacao_frete': 'Cotação Frete',
    'nf_emitida': 'NF Emitida',
    'despachado': 'Despachado',
    'em_transito': 'Em Trânsito',
    'saiu_entrega': 'Saiu p/ Entrega',
    'ocorrencia': 'Ocorrência',
  };
  return labels[status] || status;
};

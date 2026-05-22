import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';

export interface DeliveryRoute {
  id: string;
  numero_entrega: string;
  status: string;
  endereco_entrega: string;
  previsao_entrega: string | null;
  data_entrega_efetiva: string | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_at: string | null;
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
  geocoded?: boolean;
}

// Fallback coordinates for Brazilian states (centro aproximado)
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

// Add some randomness to avoid overlapping markers when using fallback
const addRandomOffset = (coords: { lat: number; lng: number }): { lat: number; lng: number } => {
  return {
    lat: coords.lat + (Math.random() - 0.5) * 0.3,
    lng: coords.lng + (Math.random() - 0.5) * 0.3,
  };
};

// Geocode a single address using the edge function
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address },
    });

    if (error || !data?.coordinates) {
      return null;
    }

    return data.coordinates;
  } catch {
    return null;
  }
};

// Save geocoded coordinates to the database
const saveCoordinatesToDB = async (
  deliveryId: string, 
  lat: number, 
  lng: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('entregas')
      .update({
        latitude: lat,
        longitude: lng,
        geocoded_at: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const useDeliveryRoutes = (enableGeocoding = true) => {
  const { user } = useAuth();
  const [geocodedDeliveries, setGeocodedDeliveries] = useState<DeliveryRoute[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const [reGeocodingId, setReGeocodingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['delivery-routes', user?.id],
    queryFn: async (): Promise<DeliveryRoute[]> => {
      interface EntregaRaw {
        id: string;
        numero_entrega: string;
        status: string;
        endereco_entrega: string;
        previsao_entrega: string | null;
        data_entrega_efetiva: string | null;
        latitude: number | null;
        longitude: number | null;
        geocoded_at: string | null;
        transportadora: { id: string; nome_fantasia: string } | null;
        cliente: { id: string; nome_fantasia: string | null; razao_social: string; cidade: string | null; estado: string | null } | null;
      }

      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id,
          numero_entrega,
          status,
          endereco_entrega,
          previsao_entrega,
          data_entrega_efetiva,
          latitude,
          longitude,
          geocoded_at,
          transportadora:transportadoras(id, nome_fantasia),
          cliente:clientes(id, nome_fantasia, razao_social, cidade, estado)
        `)
        .not('status', 'in', '("entregue","finalizado")')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map deliveries with coordinates from DB or fallback
      return (data || []).map((entrega: EntregaRaw) => {
        // Check if we have persisted coordinates
        if (entrega.latitude && entrega.longitude) {
          return {
            ...entrega,
            coordinates: { lat: Number(entrega.latitude), lng: Number(entrega.longitude) },
            geocoded: true,
          };
        }

        // Use fallback based on estado
        const estado = entrega.cliente?.estado || null;
        const baseCoords = getCoordinatesFromEstado(estado);
        
        return {
          ...entrega,
          coordinates: baseCoords ? addRandomOffset(baseCoords) : undefined,
          geocoded: false,
        };
      });
    },
    staleTime: QUERY_STALE_TIME.REALTIME,
    enabled: !!user?.id,
  });

  // Geocode addresses that don't have persisted coordinates
  const geocodeDeliveries = useCallback(async (deliveries: DeliveryRoute[]) => {
    if (!enableGeocoding || deliveries.length === 0) return;

    // Only geocode deliveries without persisted coordinates
    const toGeocode = deliveries.filter(d => !d.geocoded_at && d.endereco_entrega);
    
    if (toGeocode.length === 0) {
      setGeocodedDeliveries(deliveries);
      return;
    }

    setIsGeocoding(true);
    setGeocodingProgress({ current: 0, total: toGeocode.length });

    const updatedDeliveries = [...deliveries];
    const failedIds = new Set<string>();
    
    // Process in batches of 3 to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < toGeocode.length; i += batchSize) {
      const batch = toGeocode.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (delivery) => {
        const fullAddress = [
          delivery.endereco_entrega,
          delivery.cliente?.cidade,
          delivery.cliente?.estado,
          'Brasil'
        ].filter(Boolean).join(', ');

        const coords = await geocodeAddress(fullAddress);
        
        if (coords) {
          await saveCoordinatesToDB(delivery.id, coords.lat, coords.lng);
        } else {
          failedIds.add(delivery.id);
        }
        
        return { id: delivery.id, coords };
      });

      const results = await Promise.all(batchPromises);
      
      results.forEach(({ id, coords }) => {
        const index = updatedDeliveries.findIndex(d => d.id === id);
        if (index !== -1) {
          if (coords) {
            updatedDeliveries[index] = {
              ...updatedDeliveries[index],
              coordinates: coords,
              geocoded: true,
              latitude: coords.lat,
              longitude: coords.lng,
              geocoded_at: new Date().toISOString(),
            };
          } else {
            updatedDeliveries[index] = {
              ...updatedDeliveries[index],
              geocoded: true,
            };
          }
        }
      });

      setGeocodingProgress({ current: Math.min(i + batchSize, toGeocode.length), total: toGeocode.length });
      
      if (i + batchSize < toGeocode.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setGeocodedDeliveries(updatedDeliveries);
    setIsGeocoding(false);

    if (failedIds.size > 0) {
      toast.warning(`Geocodificação incompleta`, {
        description: `${failedIds.size} endereços não foram localizados no mapa.`
      });
    }
  }, [enableGeocoding]);

  // Trigger geocoding when data loads
  useEffect(() => {
    if (query.data && query.data.length > 0 && geocodedDeliveries.length === 0) {
      geocodeDeliveries(query.data);
    }
  }, [query.data, geocodeDeliveries, geocodedDeliveries.length]);

  // Re-geocode a single delivery (for when address is updated)
  const reGeocodeDelivery = useCallback(async (deliveryId: string) => {
    const currentData = geocodedDeliveries.length > 0 ? geocodedDeliveries : query.data;
    const delivery = currentData?.find(d => d.id === deliveryId);
    
    if (!delivery || !delivery.endereco_entrega) return false;

    setReGeocodingId(deliveryId);

    try {
      // Build full address for geocoding
      const fullAddress = [
        delivery.endereco_entrega,
        delivery.cliente?.cidade,
        delivery.cliente?.estado,
        'Brasil'
      ].filter(Boolean).join(', ');

      const coords = await geocodeAddress(fullAddress);
      
      if (coords) {
        // Save to database
        await saveCoordinatesToDB(deliveryId, coords.lat, coords.lng);
        
        // Update local state
        const updatedDeliveries = (currentData || []).map(d => {
          if (d.id === deliveryId) {
            return {
              ...d,
              coordinates: coords,
              geocoded: true,
              latitude: coords.lat,
              longitude: coords.lng,
              geocoded_at: new Date().toISOString(),
            };
          }
          return d;
        });
        
        setGeocodedDeliveries(updatedDeliveries);
        setReGeocodingId(null);
        return true;
      }
      
      setReGeocodingId(null);
      return false;
    } catch {
      setReGeocodingId(null);
      return false;
    }
  }, [geocodedDeliveries, query.data]);

  // Return geocoded data if available, otherwise return query data
  const data = geocodedDeliveries.length > 0 ? geocodedDeliveries : query.data;

  return {
    ...query,
    data,
    isGeocoding,
    geocodingProgress,
    reGeocodingId,
    reGeocodeDelivery,
    refetchWithGeocoding: async () => {
      setGeocodedDeliveries([]);
      const result = await query.refetch();
      if (result.data) {
        await geocodeDeliveries(result.data);
      }
    },
  };
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

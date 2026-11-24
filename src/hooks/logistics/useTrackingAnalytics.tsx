/* eslint-disable sonarjs/cognitive-complexity */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/hooks/auth/useAuth";
import { QUERY_STALE_TIME } from '@/lib/queryConfig';

interface TrackingPoint {
  id: string;
  lalamove_order_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  driver_name: string | null;
  order_status: string | null;
}

interface TrackingMetrics {
  orderId: string;
  driverName: string;
  totalDeliveryTimeMinutes: number;
  totalDistanceKm: number;
  averageSpeedKmh: number;
  numberOfStops: number;
  longestStopMinutes: number;
  pointsRecorded: number;
  startTime: string;
  endTime: string;
}

interface AnalyticsSummary {
  totalDeliveries: number;
  avgDeliveryTimeMinutes: number;
  avgSpeedKmh: number;
  avgStopsPerDelivery: number;
  totalDistanceKm: number;
  deliveries: TrackingMetrics[];
}

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth radius in km
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const analyzeTrackingData = (points: TrackingPoint[]): TrackingMetrics | null => {
  if (points.length < 2) return null;

  const sortedPoints = [...points].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const startTime = new Date(sortedPoints[0].recorded_at);
  const endTime = new Date(sortedPoints[sortedPoints.length - 1].recorded_at);
  const totalTimeMinutes = (endTime.getTime() - startTime.getTime()) / 1000 / 60;

  let totalDistanceKm = 0;
  let numberOfStops = 0;
  let currentStopDuration = 0;
  let longestStopMinutes = 0;
  const STOP_THRESHOLD_METERS = 50;
  const STOP_TIME_THRESHOLD_SECONDS = 120;

  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];
    
    const distance = calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
    
    totalDistanceKm += distance;

    const timeDiff = (new Date(curr.recorded_at).getTime() - new Date(prev.recorded_at).getTime()) / 1000;
    
    if (distance * 1000 < STOP_THRESHOLD_METERS) {
      currentStopDuration += timeDiff;
      if (currentStopDuration >= STOP_TIME_THRESHOLD_SECONDS) {
        if (currentStopDuration === timeDiff + (sortedPoints[i - 2] ? 
          (new Date(prev.recorded_at).getTime() - new Date(sortedPoints[i - 2].recorded_at).getTime()) / 1000 : 0)) {
          numberOfStops++;
        }
        longestStopMinutes = Math.max(longestStopMinutes, currentStopDuration / 60);
      }
    } else {
      currentStopDuration = 0;
    }
  }

  const avgSpeedKmh = totalTimeMinutes > 0 ? (totalDistanceKm / totalTimeMinutes) * 60 : 0;

  return {
    orderId: sortedPoints[0].lalamove_order_id,
    driverName: sortedPoints[0].driver_name || 'Desconhecido',
    totalDeliveryTimeMinutes: Math.round(totalTimeMinutes),
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    averageSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
    numberOfStops,
    longestStopMinutes: Math.round(longestStopMinutes),
    pointsRecorded: points.length,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  };
};

// `rastreamento_historico` e a tabela de maior crescimento do sistema: uma linha por consulta
// de rastreio. Sem teto, /analytics baixa a tabela inteira. 5000 e o mesmo teto de
// ExportacaoDados/AuditTrail. O teto nao substitui a janela de data: um intervalo largo
// ainda traz milhares de linhas, entao a janela e obrigatoria.
const TRACKING_POINTS_LIMIT = 5000;

export interface TrackingDateRange {
  from: Date;
  to: Date;
}

export const useTrackingAnalytics = ({ from, to }: TrackingDateRange) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tracking-analytics', user?.id, from.toISOString(), to.toISOString()],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const { data, error } = await supabase
        .from('rastreamento_historico')
        .select('*')
        .gte('recorded_at', from.toISOString())
        .lte('recorded_at', to.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(TRACKING_POINTS_LIMIT);

      if (error) throw error;

      // O teto corta os pontos mais antigos, entao o cliente reinverte para ordem cronologica.
      const orderedPoints = [...(data || [])].reverse();

      const groupedByOrder: Record<string, TrackingPoint[]> = {};
      orderedPoints.forEach((point) => {
        if (!groupedByOrder[point.lalamove_order_id]) {
          groupedByOrder[point.lalamove_order_id] = [];
        }
        groupedByOrder[point.lalamove_order_id].push(point);
      });

      const deliveries: TrackingMetrics[] = [];
      Object.values(groupedByOrder).forEach((points) => {
        const metrics = analyzeTrackingData(points);
        if (metrics) {
          deliveries.push(metrics);
        }
      });

      const totalDeliveries = deliveries.length;
      const avgDeliveryTimeMinutes = totalDeliveries > 0
        ? Math.round(deliveries.reduce((sum, d) => sum + d.totalDeliveryTimeMinutes, 0) / totalDeliveries)
        : 0;
      const avgSpeedKmh = totalDeliveries > 0
        ? Math.round((deliveries.reduce((sum, d) => sum + d.averageSpeedKmh, 0) / totalDeliveries) * 10) / 10
        : 0;
      const avgStopsPerDelivery = totalDeliveries > 0
        ? Math.round((deliveries.reduce((sum, d) => sum + d.numberOfStops, 0) / totalDeliveries) * 10) / 10
        : 0;
      const totalDistanceKm = Math.round(deliveries.reduce((sum, d) => sum + d.totalDistanceKm, 0) * 100) / 100;

      return {
        totalDeliveries,
        avgDeliveryTimeMinutes,
        avgSpeedKmh,
        avgStopsPerDelivery,
        totalDistanceKm,
        deliveries,
      };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
    enabled: !!user?.id,
  });
};

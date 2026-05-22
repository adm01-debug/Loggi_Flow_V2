import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Anomaly {
  id: string;
  level: 'info' | 'warn' | 'crit';
  cause: string;
  action: string;
  unit: string;
  time: string;
  vehicle_id: string;
  telemetry?: { bpm: number }[];
}

export function useBiometricAnomalies() {
  return useQuery({
    queryKey: ['biometric-anomalies'],
    queryFn: async (): Promise<Anomaly[]> => {
      const { data, error } = await supabase
        .from('bio_sync_telemetry')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(entry => ({
        id: entry.id,
        level: entry.severity === 'critical' ? 'crit' : entry.severity === 'warning' ? 'warn' : 'info',
        cause: entry.cause || (entry.heart_rate > 100 ? 'Frequência Cardíaca Elevada' : 'Fadiga Detectada'),
        action: entry.suggested_action || (entry.heart_rate > 100 ? 'Solicitar Parada Imediata' : 'Monitoramento Reforçado'),
        unit: entry.vehicle_id || 'UNKNOWN',
        time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vehicle_id: entry.vehicle_id || '',
        telemetry: [{ bpm: entry.heart_rate - 10 }, { bpm: entry.heart_rate - 5 }, { bpm: entry.heart_rate }]
      }));
    },
    refetchInterval: 5000
  });
}

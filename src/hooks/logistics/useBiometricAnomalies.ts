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

      return (data || []).map(entry => {
        const heartRate = Number(entry.heart_rate) || 0;
        return {
          id: entry.id,
          level: (() => { if (entry.severity === 'critical') return 'crit'; if (entry.severity === 'warning') return 'warn'; return 'info'; })(),
          cause: entry.cause || (heartRate > 100 ? 'Frequência Cardíaca Elevada' : 'Fadiga Detectada'),
          action: entry.suggested_action || (heartRate > 100 ? 'Solicitar Parada Imediata' : 'Monitoramento Reforçado'),
          unit: entry.vehicle_id || 'UNKNOWN',
          time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          vehicle_id: entry.vehicle_id || '',
          telemetry: [{ bpm: Math.max(0, heartRate - 10) }, { bpm: Math.max(0, heartRate - 5) }, { bpm: heartRate }]
        };
      });
    },
    refetchInterval: 5000
  });
}

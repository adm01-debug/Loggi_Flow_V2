import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uniqueChannelName } from "@/lib/realtimeChannel";

export interface RiskZone {
  id: string;
  center: [number, number];
  radius: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cause?: string;
  action?: string;
}

export function useMapWeatherSync() {
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRiskZones = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('risk_zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setRiskZones(data.map(z => ({
          id: z.id,
          center: [z.center_lng, z.center_lat] as [number, number],
          radius: z.radius,
          severity: (z.severity ?? 'low') as 'low' | 'medium' | 'high' | 'critical',
          cause: z.cause || undefined,
          action: z.suggested_action || undefined
        })));
      }
    } catch (err) {
      console.error("Error fetching risk zones:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Nome unico por instancia: o nome fixo anterior fazia a segunda montagem
  // do hook perder os INSERTs de zonas de risco (achado R-09).
  const [canalZonas] = useState(() => uniqueChannelName('risk-zones-changes'));

  useEffect(() => {
    fetchRiskZones();
    
    // Subscribe to new risk zones
    const channel = supabase
      .channel(canalZonas)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'risk_zones' }, () => {
        fetchRiskZones();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canalZonas]);

  return { riskZones, isLoading, refetch: fetchRiskZones };
}

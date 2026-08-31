import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSLAMetrics() {
  return useQuery({
    queryKey: ["sla-metrics"],
    queryFn: async () => {
      // Fetch performance metrics from the new table
      const { data: metrics, error: metricsError } = await supabase
        .from("performance_metrics")
        .select("*")
        .order("period_end", { ascending: false });

      if (metricsError) throw metricsError;

      // Also fetch pending SLA alerts
      const { data: alerts, error: alertsError } = await supabase
        .from("sla_alerts")
        .select("*")
        .is("resolved_at", null)
        .order("created_at", { ascending: false });

      if (alertsError) throw alertsError;

      // Aggregating for dashboard
      const totalEntregas = metrics.reduce((acc, m) => acc + (m.total_freights || 0), 0);
      const deliveriesOnTime = metrics.reduce((acc, m) => acc + (m.on_time_deliveries || 0), 0);
      const deliveriesLate = metrics.reduce((acc, m) => acc + (m.late_deliveries || 0), 0);
      const avgLeadTime = metrics.length > 0 
        ? metrics.reduce((acc, m) => acc + Number(m.average_lead_time_hours || 0), 0) / metrics.length 
        : 0;
      
      const taxaOTIF = totalEntregas > 0 ? (deliveriesOnTime / totalEntregas) * 100 : 0;

      // Group by entity for transportadoras
      const carriers = metrics.filter(m => m.entity_type === 'carrier');
      const performancePorTransportadora = carriers.map(c => ({
        nome: `Entity ${c.entity_id.slice(0,8)}`, // We'd need to join with transportadoras for real names
        totalEntregas: c.total_freights,
        taxaOTIF: Number(c.sla_compliance_rate || 0)
      }));

      return {
        totalEntregas,
        entregasNoPrazo: deliveriesOnTime,
        entregasAtrasadas: deliveriesLate,
        tempoMedioEntrega: avgLeadTime,
        taxaOTIF,
        performancePorTransportadora,
        alerts,
        tendenciaSemanal: [] // Placeholder
      };
    }
  });
}

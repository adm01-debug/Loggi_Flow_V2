import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/queryConfig";
import { startOfMonth, subMonths, endOfMonth, format, differenceInHours } from "date-fns";

export interface MonthlyTrend {
  month: string;
  entregas: number;
  coletas: number;
  ocorrencias: number;
  custoFrete: number;
  otif: number;
}

export interface CarrierOTIF {
  id: string;
  name: string;
  total: number;
  onTime: number;
  otifRate: number;
  avgCost: number;
}

export function useExecutiveMetrics() {
  const { user } = useAuth();

  // Historical monthly trends (last 6 months)
  const trends = useQuery({
    queryKey: ["exec-trends", user?.id],
    queryFn: async (): Promise<MonthlyTrend[]> => {
      const now = new Date();
      const months: MonthlyTrend[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate).toISOString();
        const end = endOfMonth(monthDate).toISOString();
        const label = format(monthDate, "MMM/yy");

        const [entregas, coletas, ocorrencias] = await Promise.all([
          supabase.from("entregas").select("status, valor_frete, previsao_entrega, data_entrega_efetiva").gte("created_at", start).lte("created_at", end),
          supabase.from("coletas").select("id").gte("created_at", start).lte("created_at", end),
          supabase.from("ocorrencias").select("id").gte("created_at", start).lte("created_at", end),
        ]);

        const entregasList = entregas.data || [];
        const delivered = entregasList.filter(e => e.status === "entregue" || e.status === "finalizado");
        const onTime = delivered.filter(e => {
          if (!e.previsao_entrega || !e.data_entrega_efetiva) return true;
          return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega);
        });
        const otif = delivered.length > 0 ? (onTime.length / delivered.length) * 100 : 0;
        const custoFrete = entregasList.reduce((acc, e) => acc + (e.valor_frete || 0), 0);

        months.push({
          month: label,
          entregas: entregasList.length,
          coletas: coletas.data?.length || 0,
          ocorrencias: ocorrencias.data?.length || 0,
          custoFrete,
          otif: Math.round(otif * 10) / 10,
        });
      }

      return months;
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD * 5,
    refetchInterval: QUERY_REFETCH_INTERVAL.DASHBOARD * 2,
    enabled: !!user?.id,
  });

  // Per-carrier OTIF breakdown
  const carrierOtif = useQuery({
    queryKey: ["exec-carrier-otif", user?.id],
    queryFn: async (): Promise<CarrierOTIF[]> => {
      const [transportadoras, entregas] = await Promise.all([
        supabase.from("transportadoras").select("id, nome_fantasia").eq("homologada", true),
        supabase.from("entregas").select("transportadora_id, status, valor_frete, previsao_entrega, data_entrega_efetiva").in("status", ["entregue", "finalizado", "despachado", "em_transito", "saiu_entrega"]),
      ]);

      const carriers = transportadoras.data || [];
      const entregasList = entregas.data || [];

      return carriers.map(c => {
        const carrierEntregas = entregasList.filter(e => e.transportadora_id === c.id);
        const delivered = carrierEntregas.filter(e => e.status === "entregue" || e.status === "finalizado");
        const onTime = delivered.filter(e => {
          if (!e.previsao_entrega || !e.data_entrega_efetiva) return true;
          return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega);
        });
        const totalCost = carrierEntregas.reduce((acc, e) => acc + (e.valor_frete || 0), 0);

        return {
          id: c.id,
          name: c.nome_fantasia || "Sem nome",
          total: carrierEntregas.length,
          onTime: onTime.length,
          otifRate: delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 1000) / 10 : 0,
          avgCost: carrierEntregas.length > 0 ? totalCost / carrierEntregas.length : 0,
        };
      }).filter(c => c.total > 0).sort((a, b) => b.otifRate - a.otifRate);
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD * 3,
    enabled: !!user?.id,
  });

  // Real average collection time (replacing the placeholder 36h)
  const avgCollectionTime = useQuery({
    queryKey: ["exec-avg-collection-time", user?.id],
    queryFn: async (): Promise<number> => {
      const { data } = await supabase
        .from("coletas")
        .select("created_at, data_efetiva_coleta")
        .not("data_efetiva_coleta", "is", null);

      if (!data || data.length === 0) return 0;

      const totalHours = data.reduce((acc, c) => {
        const hours = differenceInHours(new Date(c.data_efetiva_coleta!), new Date(c.created_at));
        return acc + Math.max(0, hours);
      }, 0);

      return Math.round((totalHours / data.length) * 10) / 10;
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD * 5,
    enabled: !!user?.id,
  });

  return { trends, carrierOtif, avgCollectionTime };
}

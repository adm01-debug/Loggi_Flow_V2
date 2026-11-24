import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/queryConfig";
import {
  startOfMonth,
  subMonths,
  endOfMonth,
  format,
  differenceInHours,
} from "date-fns";

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
      const periodsBack = 6;
      // Os seis intervalos sao contiguos: o mes de cada linha sai do proprio `created_at` no cliente, entao
      // uma consulta por tabela cobre todos os meses (P-03, etapa 221). Eram 18 consultas, agora 3.
      const inicio = startOfMonth(subMonths(now, periodsBack - 1));
      const fim = endOfMonth(now);

      const [{ data: entregas }, { data: coletas }, { data: ocorrencias }] =
        await Promise.all([
          supabase
            .from("entregas")
            .select(
              "status, valor_frete, previsao_entrega, data_entrega_efetiva, created_at",
            )
            .is("deleted_at", null)
            .gte("created_at", inicio.toISOString())
            .lte("created_at", fim.toISOString())
            .limit(periodsBack * 1000),
          supabase
            .from("coletas")
            .select("id, created_at")
            .is("deleted_at", null)
            .gte("created_at", inicio.toISOString())
            .lte("created_at", fim.toISOString())
            .limit(periodsBack * 1000),
          supabase
            .from("ocorrencias")
            .select("id, created_at")
            .gte("created_at", inicio.toISOString())
            .lte("created_at", fim.toISOString())
            .limit(periodsBack * 500),
        ]);

      // A chave do mes e local, o mesmo criterio que o servidor ja filtrava (`startOfMonth`/`endOfMonth`).
      const agruparPorMes = <T extends { created_at: string }>(linhas: T[]) => {
        const porMes: Record<string, T[]> = {};
        linhas.forEach((linha) => {
          const chave = format(new Date(linha.created_at), "yyyy-MM");
          if (!porMes[chave]) porMes[chave] = [];
          porMes[chave].push(linha);
        });
        return porMes;
      };

      const entregasPorMes = agruparPorMes(entregas || []);
      const coletasPorMes = agruparPorMes(coletas || []);
      const ocorrenciasPorMes = agruparPorMes(ocorrencias || []);

      return Array.from({ length: periodsBack }).map((_, i) => {
        const monthDate = subMonths(now, periodsBack - 1 - i); // Reversed order to build chronologically
        const chave = format(monthDate, "yyyy-MM");
        const label = format(monthDate, "MMM/yy");

        const entregasList = entregasPorMes[chave] || [];
        const delivered = entregasList.filter(
          (e) => e.status === "entregue" || e.status === "finalizado",
        );
        const onTime = delivered.filter((e) => {
          if (!e.previsao_entrega || !e.data_entrega_efetiva) return false;
          return (
            new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega)
          );
        });
        const otif =
          delivered.length > 0 ? (onTime.length / delivered.length) * 100 : 0;
        const custoFrete = entregasList.reduce(
          (acc, e) => acc + (e.valor_frete || 0),
          0,
        );

        return {
          month: label,
          entregas: entregasList.length,
          coletas: (coletasPorMes[chave] || []).length,
          ocorrencias: (ocorrenciasPorMes[chave] || []).length,
          custoFrete,
          otif: Math.round(otif * 10) / 10,
        };
      });
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
        supabase
          .from("transportadoras")
          .select("id, nome_fantasia")
          .is("deleted_at", null)
          .eq("homologada", true)
          .limit(100),
        supabase
          .from("entregas")
          .select(
            "transportadora_id, status, valor_frete, previsao_entrega, data_entrega_efetiva",
          )
          .is("deleted_at", null)
          .in("status", [
            "entregue",
            "finalizado",
            "despachado",
            "em_transito",
            "saiu_entrega",
          ])
          .limit(2000),
      ]);

      const carriers = transportadoras.data || [];
      const entregasList = entregas.data || [];

      return carriers
        .map((c) => {
          const carrierEntregas = entregasList.filter(
            (e) => e.transportadora_id === c.id,
          );
          const delivered = carrierEntregas.filter(
            (e) => e.status === "entregue" || e.status === "finalizado",
          );
          const onTime = delivered.filter((e) => {
            if (!e.previsao_entrega || !e.data_entrega_efetiva) return false;
            return (
              new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega)
            );
          });
          const totalCost = carrierEntregas.reduce(
            (acc, e) => acc + (e.valor_frete || 0),
            0,
          );

          return {
            id: c.id,
            name: c.nome_fantasia || "Sem nome",
            total: carrierEntregas.length,
            onTime: onTime.length,
            otifRate:
              delivered.length > 0
                ? Math.round((onTime.length / delivered.length) * 1000) / 10
                : 0,
            avgCost:
              carrierEntregas.length > 0
                ? totalCost / carrierEntregas.length
                : 0,
          };
        })
        .filter((c) => c.total > 0)
        .sort((a, b) => b.otifRate - a.otifRate);
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
        .is("deleted_at", null)
        .not("data_efetiva_coleta", "is", null)
        .limit(1000);

      if (!data || data.length === 0) return 0;

      const totalHours = data.reduce((acc, c) => {
        const hours = differenceInHours(
          new Date(c.data_efetiva_coleta!),
          new Date(c.created_at),
        );
        return acc + Math.max(0, hours);
      }, 0);

      return Math.round((totalHours / data.length) * 10) / 10;
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD * 5,
    enabled: !!user?.id,
  });

  return { trends, carrierOtif, avgCollectionTime };
}

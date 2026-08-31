import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

export function useDashboardData(dateRange: DateRange) {
  const { user } = useAuth();
  const {
    data: combinedData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-data-combined", dateRange.from, dateRange.to, user?.id],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to)
        return { coletas: [], entregas: [] };
      const startDate = startOfDay(dateRange.from).toISOString();
      const endDate = endOfDay(dateRange.to).toISOString();

      const [{ data: coletas }, { data: entregas }] = await Promise.all([
        supabase
          .from("coletas")
          .select("id, status, created_at")
          .is("deleted_at", null)
          .gte("created_at", startDate)
          .lte("created_at", endDate)
          .limit(1000),
        supabase
          .from("entregas")
          .select("id, status, created_at")
          .is("deleted_at", null)
          .gte("created_at", startDate)
          .lte("created_at", endDate)
          .limit(1000),
      ]);
      return { coletas: coletas || [], entregas: entregas || [] };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
    // P23: não dispara a query até o user estar carregado. Sem isso,
    // no F5 o React Query faz a chamada antes do getSession terminar,
    // recebe 401 (sem token), o data fica vazio, e os cards do
    // dashboard aparecem zerados até o próximo refetch manual.
    enabled: !!user?.id,
  });

  const chartData = useMemo(() => {
    if (!combinedData || !dateRange.from || !dateRange.to) return [];
    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const coletasCount = combinedData.coletas.filter(
        (c) => format(new Date(c.created_at), "yyyy-MM-dd") === dayStr,
      ).length;
      const entregasCount = combinedData.entregas.filter(
        (e) => format(new Date(e.created_at), "yyyy-MM-dd") === dayStr,
      ).length;
      return {
        name: format(day, "EEE", { locale: ptBR }),
        coletas: coletasCount,
        entregas: entregasCount,
        total: coletasCount + entregasCount,
      };
    });
  }, [combinedData, dateRange.from, dateRange.to]);

  const statusStats = useMemo(() => {
    if (!combinedData)
      return { pendentes: 0, transito: 0, finalizadas: 0, problemas: 0 };

    let pendentes = 0,
      transito = 0,
      finalizadas = 0,
      problemas = 0;

    combinedData.coletas.forEach((c) => {
      if (["aguardando_liberacao", "solicitada"].includes(c.status))
        pendentes++;
      else if (c.status === "em_transito") transito++;
      else if (["conferencia_ok", "finalizada"].includes(c.status))
        finalizadas++;
      else if (c.status === "divergencia") problemas++;
    });

    combinedData.entregas.forEach((e) => {
      if (
        ["aguardando_producao", "pronto_despacho", "cotacao_frete"].includes(
          e.status,
        )
      )
        pendentes++;
      else if (["em_transito", "despachado", "saiu_entrega"].includes(e.status))
        transito++;
      else if (["entregue", "finalizado"].includes(e.status)) finalizadas++;
      else if (e.status === "ocorrencia") problemas++;
    });

    return { pendentes, transito, finalizadas, problemas };
  }, [combinedData]);

  return { chartData, statusStats, isLoading, refetch };
}

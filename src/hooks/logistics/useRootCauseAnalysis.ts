import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  analyzeRootCauses,
  type PredictionRecord,
  type RootCauseReport,
} from "@/lib/predictions/rootCauseAnalyzer";

interface UseRootCauseAnalysisOptions {
  transportadora?: string | null;
  windowDays?: number;
  limit?: number;
}

/**
 * Busca predições recentes com atraso confirmado e agrega em causas raiz.
 * Escopo respeitado por RLS de `delay_predictions_history`.
 */
export function useRootCauseAnalysis(opts: UseRootCauseAnalysisOptions = {}) {
  const { transportadora, windowDays = 30, limit = 500 } = opts;

  return useQuery<RootCauseReport>({
    queryKey: ["root-cause-analysis", transportadora ?? "all", windowDays, limit],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const sinceIso = new Date(Date.now() - windowDays * 86_400_000).toISOString();
      let q = supabase
        .from("delay_predictions_history")
        .select(
          "entity_id,transportadora,was_accurate,actual_delay_hours,horas_estimadas_atraso,motivos,predicted_at",
        )
        .gte("predicted_at", sinceIso)
        .order("predicted_at", { ascending: false })
        .limit(limit);

      if (transportadora && transportadora !== "all") {
        q = q.eq("transportadora", transportadora);
      }

      const { data, error } = await q;
      if (error) throw error;
      return analyzeRootCauses((data ?? []) as PredictionRecord[]);
    },
  });
}

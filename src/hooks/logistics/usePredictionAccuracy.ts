import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PredictionAccuracyRow {
  dia: string;
  risco: "baixo" | "medio" | "alto" | "critico";
  total_confirmadas: number;
  total_acertos: number;
  acuracia_percentual: number | null;
  total_predicoes: number;
}

export interface AccuracySummary {
  windowDays: 7 | 30;
  totalConfirmadas: number;
  totalAcertos: number;
  acuraciaPercentual: number | null;
  totalPredicoes: number;
}

const summarize = (rows: PredictionAccuracyRow[], windowDays: 7 | 30): AccuracySummary => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const filtered = rows.filter((r) => new Date(r.dia) >= cutoff);
  const totalConfirmadas = filtered.reduce((acc, r) => acc + Number(r.total_confirmadas || 0), 0);
  const totalAcertos = filtered.reduce((acc, r) => acc + Number(r.total_acertos || 0), 0);
  const totalPredicoes = filtered.reduce((acc, r) => acc + Number(r.total_predicoes || 0), 0);
  return {
    windowDays,
    totalConfirmadas,
    totalAcertos,
    totalPredicoes,
    acuraciaPercentual: totalConfirmadas > 0 ? Number(((totalAcertos / totalConfirmadas) * 100).toFixed(2)) : null,
  };
};

export function usePredictionAccuracy() {
  const query = useQuery({
    queryKey: ["prediction-accuracy"],
    queryFn: async (): Promise<PredictionAccuracyRow[]> => {
      const { data, error } = await supabase
        .from("v_prediction_accuracy" as never)
        .select("*");
      if (error) throw error;
      return (data ?? []) as PredictionAccuracyRow[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const rows = query.data ?? [];
  return {
    ...query,
    rows,
    last7Days: summarize(rows, 7),
    last30Days: summarize(rows, 30),
  };
}

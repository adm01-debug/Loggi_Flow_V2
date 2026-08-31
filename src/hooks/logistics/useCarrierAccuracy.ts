import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CarrierAccuracyRow {
  transportadora: string;
  risco: string;
  total_predicoes: number;
  total_confirmadas: number;
  total_acertos: number;
  acuracia_percentual: number | null;
  desvio_medio_horas: number | null;
  ultima_predicao: string | null;
}

export interface CarrierAccuracySummary {
  transportadora: string;
  totalPredicoes: number;
  totalConfirmadas: number;
  acuraciaPercentual: number | null;
  desvioMedioHoras: number | null;
  porRisco: CarrierAccuracyRow[];
}

/**
 * Agrega acurácia preditiva por transportadora (últimos 30 dias).
 * Ordena por volume de predições confirmadas, depois por acurácia.
 */
export function useCarrierAccuracy() {
  return useQuery({
    queryKey: ["prediction-accuracy", "by-carrier"],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async (): Promise<CarrierAccuracySummary[]> => {
      const { data, error } = await supabase
        .from("v_prediction_accuracy_by_carrier" as never)
        .select("*")
        .returns<CarrierAccuracyRow[]>();

      if (error) throw error;
      const rows = data ?? [];

      const byCarrier = new Map<string, CarrierAccuracyRow[]>();
      for (const row of rows) {
        const arr = byCarrier.get(row.transportadora) ?? [];
        arr.push(row);
        byCarrier.set(row.transportadora, arr);
      }

      const summaries: CarrierAccuracySummary[] = [];
      for (const [transportadora, group] of byCarrier.entries()) {
        const totalPredicoes = group.reduce((s, r) => s + (r.total_predicoes ?? 0), 0);
        const totalConfirmadas = group.reduce((s, r) => s + (r.total_confirmadas ?? 0), 0);
        const totalAcertos = group.reduce((s, r) => s + (r.total_acertos ?? 0), 0);
        const acuraciaPercentual =
          totalConfirmadas > 0
            ? Math.round((100 * totalAcertos) / totalConfirmadas)
            : null;

        const desviosValidos = group
          .map((r) => r.desvio_medio_horas)
          .filter((v): v is number => v !== null && v !== undefined);
        const desvioMedioHoras =
          desviosValidos.length > 0
            ? Number(
                (
                  desviosValidos.reduce((s, v) => s + v, 0) / desviosValidos.length
                ).toFixed(2),
              )
            : null;

        summaries.push({
          transportadora,
          totalPredicoes,
          totalConfirmadas,
          acuraciaPercentual,
          desvioMedioHoras,
          porRisco: group,
        });
      }

      summaries.sort((a, b) => {
        if (b.totalConfirmadas !== a.totalConfirmadas) {
          return b.totalConfirmadas - a.totalConfirmadas;
        }
        return (b.acuraciaPercentual ?? -1) - (a.acuraciaPercentual ?? -1);
      });

      return summaries;
    },
  });
}

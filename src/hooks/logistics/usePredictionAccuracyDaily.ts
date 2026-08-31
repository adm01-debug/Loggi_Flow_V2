import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PredictionAccuracyDailyRow {
  dia: string;
  total_confirmadas: number;
  acertos: number;
  acuracia_pct: number | null;
}

export function usePredictionAccuracyDaily() {
  return useQuery({
    queryKey: ["prediction-accuracy-daily"],
    queryFn: async (): Promise<PredictionAccuracyDailyRow[]> => {
      const { data, error } = await supabase
        .from("v_prediction_accuracy_daily" as never)
        .select("*");
      if (error) throw error;
      return (data ?? []) as PredictionAccuracyDailyRow[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

export interface SLAMetas {
  criticoHoras: number;
  altoHoras: number;
  medioHoras: number;
  metaOnTimePct: number;
}

export const DEFAULT_METAS: SLAMetas = {
  criticoHoras: 4,
  altoHoras: 12,
  medioHoras: 24,
  metaOnTimePct: 95,
};

const METAS_STORAGE_KEY = "sla-panel-metas";

export function useSLAMetas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dbMetas, isLoading } = useQuery({
    queryKey: ["sla-panel-metas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_panel_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Migrate from localStorage if present
        let initialMetas = { ...DEFAULT_METAS };
        const saved = localStorage.getItem(METAS_STORAGE_KEY);
        if (saved) {
          try {
            initialMetas = { ...DEFAULT_METAS, ...JSON.parse(saved) };
          } catch {
            /* ignore */
          }
        }

        const { data: newData, error: insertError } = await supabase
          .from("user_panel_preferences")
          .insert({
            user_id: user!.id,
            sla_critico_horas: initialMetas.criticoHoras,
            sla_alto_horas: initialMetas.altoHoras,
            sla_medio_horas: initialMetas.medioHoras,
            sla_meta_on_time_pct: initialMetas.metaOnTimePct,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        // Clean up localStorage (data now lives in DB)
        localStorage.removeItem(METAS_STORAGE_KEY);
        return newData;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: QUERY_STALE_TIME.USER,
  });

  const metas: SLAMetas = dbMetas
    ? {
        criticoHoras: Number(dbMetas.sla_critico_horas),
        altoHoras: Number(dbMetas.sla_alto_horas),
        medioHoras: Number(dbMetas.sla_medio_horas),
        metaOnTimePct: Number(dbMetas.sla_meta_on_time_pct),
      }
    : DEFAULT_METAS;

  const isLoaded = !isLoading && !!dbMetas;

  const updateMutation = useMutation({
    mutationFn: async (newMetas: SLAMetas) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_panel_preferences")
        .update({
          sla_critico_horas: newMetas.criticoHoras,
          sla_alto_horas: newMetas.altoHoras,
          sla_medio_horas: newMetas.medioHoras,
          sla_meta_on_time_pct: newMetas.metaOnTimePct,
        })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sla-panel-metas", user?.id],
      });
    },
  });

  const saveMetas = useCallback(
    (newMetas: SLAMetas) => {
      updateMutation.mutate(newMetas);
    },
    [updateMutation],
  );

  return {
    metas,
    isLoaded,
    updateMetas: updateMutation.mutate,
    saveMetas,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
  };
}

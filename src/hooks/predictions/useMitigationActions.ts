/**
 * useMitigationActions — CRUD + agregações de ações de mitigação executadas.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import type { RootCauseCategory } from "@/lib/predictions/rootCauseAnalyzer";
import type { MitigationPriority } from "@/lib/predictions/mitigationRecommender";

export type MitigationStatus = "planejada" | "em_execucao" | "concluida" | "cancelada";

export interface MitigationActionRow {
  id: string;
  user_id: string;
  category: RootCauseCategory;
  headline: string;
  priority: MitigationPriority;
  focus_carrier: string | null;
  impact_score: number;
  actions: string[];
  status: MitigationStatus;
  otif_before: number | null;
  otif_after: number | null;
  otif_delta: number | null;
  notes: string | null;
  executed_at: string | null;
  measured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMitigationInput {
  category: RootCauseCategory;
  headline: string;
  priority: MitigationPriority;
  focus_carrier: string | null;
  impact_score: number;
  actions: string[];
  otif_before?: number | null;
  notes?: string | null;
}

export interface MeasureMitigationInput {
  id: string;
  otif_after: number;
  status?: MitigationStatus;
  notes?: string | null;
}

const KEY = ["mitigation-actions"] as const;

export function useMitigationActions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: async (): Promise<MitigationActionRow[]> => {
      const { data, error } = await supabase
        .from("mitigation_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        actions: Array.isArray(r.actions) ? (r.actions as string[]) : [],
      })) as MitigationActionRow[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: CreateMitigationInput) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("mitigation_actions")
        .insert({
          user_id: user.id,
          category: input.category,
          headline: input.headline,
          priority: input.priority,
          focus_carrier: input.focus_carrier,
          impact_score: input.impact_score,
          actions: input.actions,
          otif_before: input.otif_before ?? null,
          notes: input.notes ?? null,
          executed_at: new Date().toISOString(),
          status: "em_execucao",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Mitigação registrada");
    },
    onError: (e: Error) => toast.error(`Falha ao registrar: ${e.message}`),
  });

  const measure = useMutation({
    mutationFn: async (input: MeasureMitigationInput) => {
      const { data, error } = await supabase
        .from("mitigation_actions")
        .update({
          otif_after: input.otif_after,
          status: input.status ?? "concluida",
          notes: input.notes ?? undefined,
          measured_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Impacto medido e registrado");
    },
    onError: (e: Error) => toast.error(`Falha ao medir: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mitigation_actions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Mitigação removida");
    },
  });

  return { list, create, measure, remove };
}

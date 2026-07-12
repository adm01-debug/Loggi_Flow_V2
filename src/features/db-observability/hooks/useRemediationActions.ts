import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RemediationSuggestion } from "../types";

export interface RemediationAction {
  id: string;
  suggestion_id: string;
  category: string;
  severity: "critical" | "warning" | "ok";
  title: string;
  detail: string | null;
  recommended_action: string;
  evidence: Record<string, unknown>;
  status: "pending" | "in_progress" | "resolved" | "ignored";
  admin_notes: string | null;
  applied_by: string | null;
  applied_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const QK = ["remediation-actions"] as const;

export function useRemediationActions() {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<RemediationAction[]> => {
      const { data, error } = await supabase
        .from("remediation_actions" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as RemediationAction[];
    },
    staleTime: 30_000,
  });
}

export function useApplyRemediation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (suggestion: RemediationSuggestion) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("remediation_actions" as never)
        .insert({
          suggestion_id: suggestion.id,
          category: suggestion.category,
          severity: suggestion.severity,
          title: suggestion.title,
          detail: suggestion.detail,
          recommended_action: suggestion.recommended_action,
          evidence: suggestion.evidence ?? {},
          status: "in_progress",
          applied_by: user.user?.id ?? null,
          applied_at: new Date().toISOString(),
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ação marcada como em andamento");
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(`Falha: ${e.message}`),
  });
}

export function useUpdateRemediationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      status: RemediationAction["status"];
      admin_notes?: string;
    }) => {
      const patch: Record<string, unknown> = {
        status: params.status,
        admin_notes: params.admin_notes ?? null,
      };
      if (params.status === "resolved" || params.status === "ignored") {
        patch.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("remediation_actions" as never)
        .update(patch as never)
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "resolved"
          ? "Marcada como resolvida ✅"
          : vars.status === "ignored"
          ? "Marcada como ignorada"
          : "Status atualizado",
      );
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(`Falha: ${e.message}`),
  });
}

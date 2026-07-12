import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IndexProposal {
  id: string;
  queryid: number | null;
  target_table: string | null;
  target_columns: string[] | null;
  ddl: string;
  rationale: string | null;
  confidence: string;
  status: "proposed" | "approved" | "applied" | "rejected" | "failed";
  applied_by: string | null;
  applied_at: string | null;
  error_message: string | null;
  created_at: string;
  baseline_mean_ms: number | null;
  post_apply_mean_ms: number | null;
  improvement_pct: number | null;
  measured_at: string | null;
}

export function useIndexProposals() {
  return useQuery({
    queryKey: ["index-proposals"],
    queryFn: async (): Promise<IndexProposal[]> => {
      const { data, error } = await (supabase.from("index_proposals" as never) as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as IndexProposal[];
    },
    staleTime: 30_000,
  });
}

export function useProposeIndex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      queryid: number | null;
      target_table: string | null;
      target_columns: string[] | null;
      ddl: string;
      rationale: string;
      confidence: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      const { data, error } = await (supabase.from("index_proposals" as never) as any)
        .insert({ ...input, proposed_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Proposta registrada para aprovação");
      qc.invalidateQueries({ queryKey: ["index-proposals"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useApplyIndexProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("apply_index_proposal", { p_id: id });
      if (error) throw error as Error;
      return data;
    },
    onSuccess: () => {
      toast.success("Índice aplicado com sucesso");
      qc.invalidateQueries({ queryKey: ["index-proposals"] });
    },
    onError: (e: Error) => toast.error(`Falha ao aplicar: ${e.message}`),
  });
}

export function useRejectIndexProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { error } = await rpc("reject_index_proposal", { p_id: id, p_reason: reason ?? null });
      if (error) throw error as Error;
    },
    onSuccess: () => {
      toast.success("Proposta rejeitada");
      qc.invalidateQueries({ queryKey: ["index-proposals"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

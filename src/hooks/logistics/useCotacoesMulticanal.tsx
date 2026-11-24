import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";

export interface CotacaoMulticanal {
  id: string;
  user_id: string;
  transportadora_id: string;
  canal: "api" | "whatsapp" | "email";
  status: "pendente" | "respondido" | "expirado" | "selecionado";
  origem_estado: string;
  origem_cidade: string | null;
  destino_estado: string;
  destino_cidade: string | null;
  peso_kg: number | null;
  volumes: number | null;
  valor_mercadoria: number | null;
  valor_cotado: number | null;
  prazo_dias: number | null;
  observacoes: string | null;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  transportadora?: {
    id: string;
    nome_fantasia: string;
    razao_social: string;
    score_performance: number | null;
  };
  workflow_logs?: Array<Record<string, unknown>>;
  retry_count?: number;
  normalization_data?: Record<string, unknown> | null;
}

export const useCotacoesMulticanal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: cotacoes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cotacoes-multicanal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotacoes_multicanal")
        .select(
          `
          id,
          canal,
          status,
          origem_estado,
          destino_estado,
          valor_cotado,
          prazo_dias,
          expires_at,
          retry_count,
          workflow_logs,
          normalization_data,
          transportadora:transportadoras (
            id, nome_fantasia, razao_social, score_performance
          )
        `,
        )
        .order("created_at", { ascending: false })
        // teto operacional: esta consulta tem refetchInterval de 30s (abaixo), entao a
        // tabela inteira era rebaixada 120x/hora por usuario. 200 e o teto de
        // useUnifiedTracking.tsx. Coluna nova lida pela tela entra aqui tambem.
        .limit(200);

      if (error) throw error;
      return data as CotacaoMulticanal[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30s (table removed from Realtime for security)
  });

  const createCotacao = useMutation({
    mutationFn: async (data: {
      transportadora_id: string;
      canal: "api" | "whatsapp" | "email";
      origem_estado: string;
      origem_cidade?: string;
      destino_estado: string;
      destino_cidade?: string;
      peso_kg?: number;
      volumes?: number;
      valor_mercadoria?: number;
      valor_cotado?: number;
      prazo_dias?: number;
      observacoes?: string;
      status?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("cotacoes_multicanal")
        .insert([
          {
            ...data,
            user_id: user!.id,
            status: data.status || "pendente",
          },
        ])
        .select(
          `*, transportadora:transportadoras (id, nome_fantasia, razao_social, score_performance)`,
        )
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-multicanal"] });
    },
  });

  const updateCotacao = useMutation({
    mutationFn: async ({
      id,
      workflow_logs,
      ...data
    }: {
      id: string;
      valor_cotado?: number;
      prazo_dias?: number;
      observacoes?: string;
      status?: string;
      retry_count?: number;
      workflow_logs?: Array<Record<string, unknown>> | Json;
    }) => {
      const updateData: TablesUpdate<"cotacoes_multicanal"> = {
        ...data,
        updated_at: new Date().toISOString(),
        workflow_logs: workflow_logs as Json,
      };
      if (data.status === "respondido") {
        updateData.responded_at = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from("cotacoes_multicanal")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-multicanal"] });
      toast.success("Cotação atualizada!");
    },
  });

  const selectCotacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cotacoes_multicanal")
        .update({ status: "selecionado", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-multicanal"] });
      toast.success("Cotação selecionada!");
    },
  });

  // Derived stats
  const ativas =
    cotacoes?.filter(
      (c) => c.status === "pendente" || c.status === "respondido",
    ) || [];
  const pendentes = cotacoes?.filter((c) => c.status === "pendente") || [];
  const respondidas = cotacoes?.filter((c) => c.status === "respondido") || [];
  const expiradas = cotacoes?.filter((c) => c.status === "expirado") || [];
  const selecionadas =
    cotacoes?.filter((c) => c.status === "selecionado") || [];

  return {
    cotacoes: cotacoes || [],
    ativas,
    pendentes,
    respondidas,
    expiradas,
    selecionadas,
    isLoading,
    error,
    refetch,
    createCotacao,
    updateCotacao,
    selectCotacao,
  };
};

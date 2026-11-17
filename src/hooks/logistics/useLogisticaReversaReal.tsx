import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LogisticaReversa {
  id: string;
  entrega_id: string | null;
  cliente_id: string | null;
  motivo: string;
  descricao_detalhada: string | null;
  status: 'pendente' | 'aprovado' | 'em_transito' | 'recebido' | 'cancelado';
  prioridade: string;
  codigo_rastreio_reverso: string | null;
  valor_estorno: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  clientes?: { razao_social: string };
  entregas?: { codigo_rastreamento: string };
}

export const useLogisticaReversaReal = () => {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["logistica-reversa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logistica_reversa")
        .select(`
          *,
          clientes (razao_social),
          entregas (codigo_rastreamento)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as LogisticaReversa[];
    },
  });

  const create = useMutation({
    mutationFn: async (newItem: Omit<Partial<LogisticaReversa>, 'entregas' | 'clientes'> & { motivo: string }) => {
      const { data, error } = await supabase
        .from("logistica_reversa")
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistica-reversa"] });
      toast.success("Solicitação de logística reversa criada com sucesso!");
    },
    onError: (error) => {
      // Silent fail
      toast.error("Erro ao criar solicitação.");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("logistica_reversa")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistica-reversa"] });
      toast.success("Status atualizado com sucesso!");
    },
  });

  return { list, create, updateStatus };
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Coleta {
  id: string;
  numero_nf: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  endereco_coleta: string;
  cidade: string;
  uf: string;
  status: 'pendente' | 'agendada' | 'em_transito' | 'coletada' | 'cancelada';
  data_agendada: string | null;
  data_coleta: string | null;
  transportadora_id: string | null;
  peso_estimado: number | null;
  volumes: number | null;
  observacoes: string | null;
  created_at: string;
}

export function useColetasReal(filters?: { status?: string; data_inicio?: string; data_fim?: string }) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['coletas-real', filters],
    queryFn: async () => {
      let query = supabase
        .from('coletas')
        .select(`*, fornecedores(id, razao_social, nome_fantasia), transportadoras(id, nome)`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.data_inicio) query = query.gte('created_at', filters.data_inicio);
      if (filters?.data_fim) query = query.lte('created_at', filters.data_fim);

      const { data, error } = await query;
      if (error) throw error;
      return data as Coleta[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (coleta: Omit<Coleta, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('coletas').insert(coleta).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletas-real'] });
      toast.success('Coleta criada!');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Coleta['status'] }) => {
      const updates: any = { status };
      if (status === 'coletada') updates.data_coleta = new Date().toISOString();
      
      const { error } = await supabase.from('coletas').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletas-real'] });
      toast.success('Status atualizado!');
    },
  });

  return {
    coletas: listQuery.data || [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    refetch: listQuery.refetch,
  };
}

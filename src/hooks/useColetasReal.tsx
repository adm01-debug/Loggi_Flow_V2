import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ColetaRow = Database['public']['Tables']['coletas']['Row'];
type ColetaInsert = Database['public']['Tables']['coletas']['Insert'];
type ColetaStatus = Database['public']['Enums']['coleta_status'];

export function useColetasReal(filters?: { status?: string; data_inicio?: string; data_fim?: string }) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['coletas-real', filters],
    queryFn: async () => {
      let query = supabase
        .from('coletas')
        .select(`*, fornecedores(id, razao_social, nome_fantasia), transportadoras(id, nome_fantasia)`)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status as ColetaStatus);
      if (filters?.data_inicio) query = query.gte('created_at', filters.data_inicio);
      if (filters?.data_fim) query = query.lte('created_at', filters.data_fim);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (coleta: ColetaInsert) => {
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
    mutationFn: async ({ id, status }: { id: string; status: ColetaStatus }) => {
      const updates: Partial<ColetaRow> = { status };
      if (status === 'finalizada') {
        updates.data_efetiva_coleta = new Date().toISOString();
      }
      
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

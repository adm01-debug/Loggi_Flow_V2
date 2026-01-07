import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type EntregaRow = Database['public']['Tables']['entregas']['Row'];
type EntregaInsert = Database['public']['Tables']['entregas']['Insert'];
type EntregaUpdate = Database['public']['Tables']['entregas']['Update'];
type EntregaStatus = Database['public']['Enums']['entrega_status'];

interface EntregaFilters {
  status?: string;
  transportadora_id?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export function useEntregasReal(filters?: EntregaFilters) {
  const queryClient = useQueryClient();

  // Listar entregas com filtros
  const listQuery = useQuery({
    queryKey: ['entregas-real', filters],
    queryFn: async () => {
      let query = supabase
        .from('entregas')
        .select(`
          *,
          transportadoras(id, nome_fantasia),
          clientes(id, razao_social, contato_email)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status as EntregaStatus);
      if (filters?.transportadora_id) query = query.eq('transportadora_id', filters.transportadora_id);
      if (filters?.data_inicio) query = query.gte('created_at', filters.data_inicio);
      if (filters?.data_fim) query = query.lte('created_at', filters.data_fim);
      if (filters?.search) {
        query = query.or(`numero_entrega.ilike.%${filters.search}%,endereco_entrega.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar entrega por ID
  const getEntrega = async (id: string) => {
    const { data, error } = await supabase
      .from('entregas')
      .select(`*, transportadoras(*), clientes(*)`)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  };

  // Criar entrega
  const createMutation = useMutation({
    mutationFn: async (entrega: EntregaInsert) => {
      const { data, error } = await supabase
        .from('entregas')
        .insert(entrega)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-real'] });
      toast.success('Entrega criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar entrega'),
  });

  // Atualizar entrega
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: EntregaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('entregas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-real'] });
      toast.success('Entrega atualizada!');
    },
  });

  // Atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EntregaStatus }) => {
      const updates: EntregaUpdate = { status, updated_at: new Date().toISOString() };
      
      if (status === 'entregue') {
        updates.data_entrega_efetiva = new Date().toISOString();
      }

      const { error } = await supabase.from('entregas').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-real'] });
      toast.success('Status atualizado!');
    },
  });

  // Delete (not soft delete since deleted_at doesn't exist)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-real'] });
      toast.success('Entrega removida');
    },
  });

  return {
    entregas: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    getEntrega,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    delete: deleteMutation.mutate,
    refetch: listQuery.refetch,
  };
}

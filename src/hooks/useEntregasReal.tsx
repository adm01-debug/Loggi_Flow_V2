import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Entrega {
  id: string;
  numero_nf: string;
  cliente_id: string;
  cliente_nome: string;
  endereco_entrega: string;
  cidade: string;
  uf: string;
  cep: string;
  status: 'pendente' | 'em_separacao' | 'em_transito' | 'entregue' | 'devolvida' | 'cancelada';
  transportadora_id: string | null;
  motorista_nome: string | null;
  custo_frete: number | null;
  peso: number | null;
  volume: number | null;
  data_previsao: string | null;
  data_entrega: string | null;
  sla_atingido: boolean | null;
  tempo_entrega: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

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
          transportadoras(id, nome),
          clientes(id, nome, email)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.transportadora_id) query = query.eq('transportadora_id', filters.transportadora_id);
      if (filters?.data_inicio) query = query.gte('created_at', filters.data_inicio);
      if (filters?.data_fim) query = query.lte('created_at', filters.data_fim);
      if (filters?.search) {
        query = query.or(`numero_nf.ilike.%${filters.search}%,cliente_nome.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Entrega[];
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
    return data as Entrega;
  };

  // Criar entrega
  const createMutation = useMutation({
    mutationFn: async (entrega: Omit<Entrega, 'id' | 'created_at' | 'updated_at'>) => {
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
    mutationFn: async ({ id, ...updates }: Partial<Entrega> & { id: string }) => {
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
    mutationFn: async ({ id, status }: { id: string; status: Entrega['status'] }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      
      if (status === 'entregue') {
        updates.data_entrega = new Date().toISOString();
      }

      const { error } = await supabase.from('entregas').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-real'] });
      toast.success('Status atualizado!');
    },
  });

  // Soft delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('entregas')
        .update({ deleted_at: new Date().toISOString() })
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

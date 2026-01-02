import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Transportadora {
  id: string;
  nome: string;
  cnpj: string;
  tipo: 'propria' | 'terceira' | 'lalamove' | 'correios';
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  custo_base: number | null;
  custo_kg: number | null;
  regioes_atendidas: string[];
  sla_horas: number | null;
  taxa_sla: number | null;
  is_active: boolean;
  created_at: string;
}

export function useTransportadorasReal() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['transportadoras-real'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('*')
        .is('deleted_at', null)
        .order('nome');

      if (error) throw error;
      return data as Transportadora[];
    },
  });

  const activeQuery = useQuery({
    queryKey: ['transportadoras-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('*')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data as Transportadora[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (transportadora: Omit<Transportadora, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('transportadoras').insert(transportadora).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras-real'] });
      toast.success('Transportadora criada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transportadora> & { id: string }) => {
      const { error } = await supabase.from('transportadoras').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras-real'] });
      toast.success('Transportadora atualizada!');
    },
  });

  // Calcular melhor transportadora para uma entrega
  const getBestTransportadora = async (params: { peso: number; regiao: string; urgente: boolean }) => {
    const { peso, regiao, urgente } = params;
    
    const transportadoras = activeQuery.data || [];
    
    // Filtrar por região
    const disponiveis = transportadoras.filter(t => 
      t.regioes_atendidas?.includes(regiao) || t.regioes_atendidas?.includes('*')
    );

    if (disponiveis.length === 0) return null;

    // Calcular custo e ordenar
    const ranked = disponiveis.map(t => ({
      ...t,
      custoEstimado: (t.custo_base || 0) + (peso * (t.custo_kg || 0)),
      score: urgente 
        ? (t.taxa_sla || 0) * 100 - (t.sla_horas || 24)
        : -((t.custo_base || 0) + (peso * (t.custo_kg || 0))),
    })).sort((a, b) => b.score - a.score);

    return ranked[0];
  };

  return {
    transportadoras: listQuery.data || [],
    transportadorasAtivas: activeQuery.data || [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    getBestTransportadora,
    refetch: listQuery.refetch,
  };
}

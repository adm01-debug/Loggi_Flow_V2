import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TransportadoraRow = Database['public']['Tables']['transportadoras']['Row'];
type TransportadoraInsert = Database['public']['Tables']['transportadoras']['Insert'];
type TransportadoraUpdate = Database['public']['Tables']['transportadoras']['Update'];

export function useTransportadorasReal() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['transportadoras-real'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('*')
        .order('nome_fantasia');

      if (error) throw error;
      return data || [];
    },
  });

  const activeQuery = useQuery({
    queryKey: ['transportadoras-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('*')
        .eq('homologada', true)
        .order('nome_fantasia');

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (transportadora: TransportadoraInsert) => {
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
    mutationFn: async ({ id, ...updates }: TransportadoraUpdate & { id: string }) => {
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
    const { regiao, urgente } = params;
    
    const transportadoras = activeQuery.data || [];
    
    // Filtrar por região
    const disponiveis = transportadoras.filter(t => 
      t.regioes_atendidas?.includes(regiao) || t.regioes_atendidas?.includes('*')
    );

    if (disponiveis.length === 0) return null;

    // Ordenar por performance score
    const ranked = disponiveis.sort((a, b) => {
      if (urgente) {
        // Priorizar por prazo
        return (a.prazo_medio_dias || 99) - (b.prazo_medio_dias || 99);
      }
      // Priorizar por score de performance
      return (b.score_performance || 0) - (a.score_performance || 0);
    });

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

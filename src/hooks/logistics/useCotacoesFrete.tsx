import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks';
import { toast } from 'sonner';

export interface CotacaoFrete {
  id: string;
  entrega_id: string;
  transportadora_id: string;
  valor: number;
  prazo_dias: number | null;
  observacoes: string | null;
  selecionada: boolean | null;
  created_at: string;
  transportadora?: { nome_fantasia: string | null };
  entrega?: { numero_entrega: string; endereco_entrega: string };
}

export function useCotacoesFrete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes-frete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotacoes_frete')
        .select(`
          *,
          transportadora:transportadoras(nome_fantasia),
          entrega:entregas(numero_entrega, endereco_entrega)
        `)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as CotacaoFrete[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const selectCotacao = useMutation({
    mutationFn: async ({ id, entregaId }: { id: string; entregaId: string }) => {
      // Deselect all others for same entrega
      await supabase
        .from('cotacoes_frete')
        .update({ selecionada: false })
        .eq('entrega_id', entregaId);
      // Select this one
      const { error } = await supabase
        .from('cotacoes_frete')
        .update({ selecionada: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes-frete'] });
      toast.success('Cotação selecionada!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCotacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cotacoes_frete').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes-frete'] });
      toast.success('Cotação removida!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { cotacoes, isLoading, selectCotacao, deleteCotacao };
}

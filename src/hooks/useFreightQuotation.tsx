import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';

export interface TabelaFrete {
  id: string;
  transportadora_id: string;
  regiao_destino: string;
  estado_destino: string;
  peso_min_kg: number;
  peso_max_kg: number;
  preco_por_kg: number;
  taxa_fixa: number;
  prazo_dias: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  transportadora?: {
    id: string;
    nome_fantasia: string;
    score_performance: number;
    homologada: boolean;
  };
}

export interface QuotationRequest {
  estado_destino: string;
  peso_kg: number;
}

export interface QuotationResult {
  transportadora_id: string;
  transportadora_nome: string;
  score_performance: number;
  valor_total: number;
  preco_por_kg: number;
  taxa_fixa: number;
  prazo_dias: number;
  regiao_destino: string;
  melhor_preco: boolean;
  melhor_prazo: boolean;
  melhor_custo_beneficio: boolean;
}

export const useFreightQuotation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all freight tables
  const { data: tabelasFrete, isLoading: isLoadingTabelas } = useQuery({
    queryKey: ['tabelas-frete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabelas_frete')
        .select(`
          *,
          transportadora:transportadoras(id, nome_fantasia, score_performance, homologada)
        `)
        .eq('ativo', true)
        .order('estado_destino');
      
      if (error) throw error;
      return data as TabelaFrete[];
    },
    staleTime: QUERY_STALE_TIME.SEMI_STATIC,
    gcTime: 30 * 60 * 1000,
    enabled: !!user?.id,
  });

  // Fetch transportadoras for dropdown
  const { data: transportadoras } = useQuery({
    queryKey: ['transportadoras-cotacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('id, nome_fantasia, score_performance, homologada')
        .eq('homologada', true)
        .order('nome_fantasia');
      
      if (error) throw error;
      return data;
    },
    staleTime: QUERY_STALE_TIME.STATIC,
    enabled: !!user?.id,
  });

  // Calculate quotations
  const calculateQuotations = (request: QuotationRequest): QuotationResult[] => {
    if (!tabelasFrete || tabelasFrete.length === 0) return [];

    const matchingTables = tabelasFrete.filter(
      (t) =>
        t.estado_destino === request.estado_destino &&
        request.peso_kg >= t.peso_min_kg &&
        request.peso_kg < t.peso_max_kg &&
        t.transportadora?.homologada
    );

    if (matchingTables.length === 0) return [];

    const quotations: QuotationResult[] = matchingTables.map((t) => ({
      transportadora_id: t.transportadora_id,
      transportadora_nome: t.transportadora?.nome_fantasia || 'N/A',
      score_performance: t.transportadora?.score_performance || 0,
      valor_total: t.taxa_fixa + (t.preco_por_kg * request.peso_kg),
      preco_por_kg: t.preco_por_kg,
      taxa_fixa: t.taxa_fixa,
      prazo_dias: t.prazo_dias,
      regiao_destino: t.regiao_destino,
      melhor_preco: false,
      melhor_prazo: false,
      melhor_custo_beneficio: false,
    }));

    // Sort by total value
    quotations.sort((a, b) => a.valor_total - b.valor_total);

    // Mark best options
    if (quotations.length > 0) {
      // Best price
      const minPrice = Math.min(...quotations.map((q) => q.valor_total));
      quotations.forEach((q) => {
        if (q.valor_total === minPrice) q.melhor_preco = true;
      });

      // Best deadline
      const minPrazo = Math.min(...quotations.map((q) => q.prazo_dias));
      quotations.forEach((q) => {
        if (q.prazo_dias === minPrazo) q.melhor_prazo = true;
      });

      // Best cost-benefit (weighted: 60% price, 40% performance score)
      const maxScore = Math.max(...quotations.map((q) => q.score_performance));
      const maxPrice = Math.max(...quotations.map((q) => q.valor_total));
      
      let bestCostBenefitScore = -Infinity;
      let bestCostBenefitIndex = 0;
      
      quotations.forEach((q, index) => {
        const normalizedPrice = 1 - (q.valor_total / maxPrice);
        const normalizedScore = maxScore > 0 ? q.score_performance / maxScore : 0;
        const costBenefitScore = (normalizedPrice * 0.6) + (normalizedScore * 0.4);
        
        if (costBenefitScore > bestCostBenefitScore) {
          bestCostBenefitScore = costBenefitScore;
          bestCostBenefitIndex = index;
        }
      });
      
      quotations[bestCostBenefitIndex].melhor_custo_beneficio = true;
    }

    return quotations;
  };

  // Add freight table entry
  const addTabelaFrete = useMutation({
    mutationFn: async (data: Omit<TabelaFrete, 'id' | 'created_at' | 'updated_at' | 'transportadora'>) => {
      const { data: result, error } = await supabase
        .from('tabelas_frete')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      toast.success('Tabela de frete adicionada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar tabela de frete: ' + error.message);
    },
  });

  // Update freight table entry
  const updateTabelaFrete = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TabelaFrete> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('tabelas_frete')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      toast.success('Tabela de frete atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tabela de frete: ' + error.message);
    },
  });

  // Delete freight table entry
  const deleteTabelaFrete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tabelas_frete')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      toast.success('Tabela de frete removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover tabela de frete: ' + error.message);
    },
  });

  // Get available states from existing tables
  const availableStates = Array.from(
    new Set(tabelasFrete?.map((t) => t.estado_destino) || [])
  ).sort();

  return {
    tabelasFrete,
    transportadoras,
    isLoadingTabelas,
    availableStates,
    calculateQuotations,
    addTabelaFrete,
    updateTabelaFrete,
    deleteTabelaFrete,
  };
};

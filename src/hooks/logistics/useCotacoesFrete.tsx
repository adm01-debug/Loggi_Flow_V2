import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from 'sonner';
import { logisticsService, type CotacaoFrete } from '@/services/api/logisticsService';

export type { CotacaoFrete };

export function useCotacoesFrete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes-frete'],
    queryFn: () => logisticsService.fetchCotacoes(),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const selectCotacao = useMutation({
    mutationFn: ({ id, entregaId }: { id: string; entregaId: string }) => 
      logisticsService.selectCotacao(id, entregaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes-frete'] });
      toast.success('Cotação selecionada!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCotacao = useMutation({
    mutationFn: (id: string) => logisticsService.deleteCotacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes-frete'] });
      toast.success('Cotação removida!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { cotacoes, isLoading, selectCotacao, deleteCotacao };
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SoftDeleteOptions {
  deletedAtColumn?: string;
  deletedByColumn?: string;
}

export function useSoftDelete(table: string, queryKey: string[], options: SoftDeleteOptions = {}) {
  const queryClient = useQueryClient();
  const { deletedAtColumn = 'deleted_at', deletedByColumn = 'deleted_by' } = options;

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from(table)
        .update({ 
          [deletedAtColumn]: new Date().toISOString(),
          [deletedByColumn]: user?.id 
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro movido para lixeira');
    },
    onError: () => toast.error('Erro ao excluir registro'),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .update({ 
          [deletedAtColumn]: null,
          [deletedByColumn]: null 
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro restaurado');
    },
    onError: () => toast.error('Erro ao restaurar registro'),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro excluído permanentemente');
    },
    onError: () => toast.error('Erro ao excluir permanentemente'),
  });

  return {
    softDelete: softDeleteMutation.mutate,
    restore: restoreMutation.mutate,
    permanentDelete: permanentDeleteMutation.mutate,
    isDeleting: softDeleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

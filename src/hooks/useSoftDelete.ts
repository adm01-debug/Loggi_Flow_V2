import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TableNames = keyof Database['public']['Tables'];

interface SoftDeleteOptions {
  deletedAtColumn?: string;
  deletedByColumn?: string;
}

export function useSoftDelete(table: TableNames, queryKey: string[], options: SoftDeleteOptions = {}) {
  const queryClient = useQueryClient();
  const { deletedAtColumn = 'deleted_at', deletedByColumn = 'deleted_by' } = options;

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates: Record<string, unknown> = { [deletedAtColumn]: new Date().toISOString() };
      if (deletedByColumn) updates[deletedByColumn] = user?.id;
      
      const { error } = await supabase.from(table).update(updates as never).eq('id', id);
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
      const updates: Record<string, unknown> = { [deletedAtColumn]: null };
      if (deletedByColumn) updates[deletedByColumn] = null;
      
      const { error } = await supabase.from(table).update(updates as never).eq('id', id);
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
      const { error } = await supabase.from(table).delete().eq('id', id);
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

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playSuccessSound, playErrorSound } from '@/utils/celebrationSounds';
import type { Database } from '@/integrations/supabase/types';

type TableNames = keyof Database['public']['Tables'];

type DynamicTable = {
  delete: () => { in: (c: string, v: string[]) => Promise<{ error: Error | null }> };
  update: (v: Record<string, unknown>) => { in: (c: string, v: string[]) => Promise<{ error: Error | null }> };
};


export interface BulkAction<T> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
  confirm?: { title: string; description: string };
  handler?: (items: T[]) => Promise<void>;
}

interface BulkActionOptions { 
  table: TableNames; 
  queryKey: string[]; 
  onSuccess?: () => void; 
}

export function useBulkActions<T extends { id: string }>(options: BulkActionOptions) {
  const { table, queryKey, onSuccess } = options;
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const selectAll = useCallback((items: T[]) => { setSelectedIds(items.map(i => i.id)); }, []);
  const clearSelection = useCallback(() => { setSelectedIds([]); }, []);
  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      setIsProcessing(true);
      const { error } = await (supabase.from(table) as unknown as DynamicTable).delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey }); 
      clearSelection(); 
      toast.success(`${selectedIds.length} itens excluídos`); 
      playSuccessSound();
      onSuccess?.(); 
    },
    onError: () => {
      toast.error('Erro ao excluir');
      playErrorSound();
    },
    onSettled: () => setIsProcessing(false),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<T> }) => {
      setIsProcessing(true);
      const { error } = await (supabase.from(table) as unknown as DynamicTable).update(data).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey }); 
      clearSelection(); 
      toast.success(`${selectedIds.length} itens atualizados`); 
      playSuccessSound();
      onSuccess?.(); 
    },
    onError: () => {
      toast.error('Erro ao atualizar');
      playErrorSound();
    },
    onSettled: () => setIsProcessing(false),
  });

  const bulkSoftDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      setIsProcessing(true);
      const { error } = await (supabase.from(table) as unknown as DynamicTable).update({ deleted_at: new Date().toISOString() }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey }); 
      clearSelection(); 
      toast.success(`${selectedIds.length} itens movidos para lixeira`); 
      playSuccessSound();
      onSuccess?.(); 
    },
    onError: () => {
      toast.error('Erro ao mover para lixeira');
      playErrorSound();
    },
    onSettled: () => setIsProcessing(false),
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      setIsProcessing(true);
      const { error } = await (supabase.from(table) as unknown as DynamicTable).update({ deleted_at: null }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey }); 
      clearSelection(); 
      toast.success(`${selectedIds.length} itens restaurados`); 
      playSuccessSound();
      onSuccess?.(); 
    },
    onError: () => {
      toast.error('Erro ao restaurar');
      playErrorSound();
    },
    onSettled: () => setIsProcessing(false),
  });

  return {
    selectedIds, 
    toggle, 
    selectAll, 
    clearSelection, 
    isSelected, 
    isProcessing, 
    selectedCount: selectedIds.length,
    bulkDelete: () => bulkDeleteMutation.mutate(selectedIds),
    bulkSoftDelete: () => bulkSoftDeleteMutation.mutate(selectedIds),
    bulkRestore: () => bulkRestoreMutation.mutate(selectedIds),
    bulkUpdate: (data: Partial<T>) => bulkUpdateMutation.mutate({ ids: selectedIds, data }),
  };
}

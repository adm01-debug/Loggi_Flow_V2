import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  is_default: boolean;
  entity_type: string;
  created_at: string;
}

export function useSavedFilters(entityType: string) {
  const queryClient = useQueryClient();

  const { data: filters = [], isLoading } = useQuery({
    queryKey: ['saved-filters', entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedFilter[];
    },
  });

  const defaultFilter = filters.find(f => f.is_default);

  const saveMutation = useMutation({
    mutationFn: async (filter: { name: string; filters: Record<string, any>; is_default?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('saved_filters')
        .insert({ user_id: user.id, entity_type: entityType, ...filter })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success('Filtro salvo com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar filtro'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_filters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success('Filtro removido');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      await supabase.from('saved_filters').update({ is_default: false }).eq('entity_type', entityType).eq('user_id', user.id);
      const { error } = await supabase.from('saved_filters').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success('Filtro padrão definido');
    },
  });

  return {
    filters,
    defaultFilter,
    isLoading,
    saveFilter: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    deleteFilter: deleteMutation.mutate,
    setDefault: setDefaultMutation.mutate,
  };
}

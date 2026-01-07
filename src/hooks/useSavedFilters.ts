import { useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  entity_type: string;
  created_at: string;
}

// Usando localStorage já que a tabela saved_filters não existe no schema
export function useSavedFilters(entityType: string) {
  const storageKey = `saved-filters-${entityType}`;
  const [filters, setFilters] = useLocalStorage<SavedFilter[]>(storageKey, []);
  const [isLoading] = useState(false);

  const defaultFilter = filters.find(f => f.is_default);

  const saveFilter = useCallback((filter: { name: string; filters: Record<string, unknown>; is_default?: boolean }) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: filter.name,
      filters: filter.filters,
      is_default: filter.is_default || false,
      entity_type: entityType,
      created_at: new Date().toISOString(),
    };

    setFilters(prev => {
      // Se o novo filtro é padrão, remover o flag dos outros
      const updated = filter.is_default 
        ? prev.map(f => ({ ...f, is_default: false }))
        : prev;
      return [...updated, newFilter];
    });
    
    toast.success('Filtro salvo com sucesso!');
  }, [entityType, setFilters]);

  const deleteFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
    toast.success('Filtro removido');
  }, [setFilters]);

  const setDefault = useCallback((id: string) => {
    setFilters(prev => prev.map(f => ({
      ...f,
      is_default: f.id === id,
    })));
    toast.success('Filtro padrão definido');
  }, [setFilters]);

  return {
    filters,
    defaultFilter,
    isLoading,
    saveFilter,
    isSaving: false,
    deleteFilter,
    setDefault,
  };
}

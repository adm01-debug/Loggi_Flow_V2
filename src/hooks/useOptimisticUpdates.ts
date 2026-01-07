import { useCallback, useState, useRef } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';

// ============================================
// OPTIMISTIC UPDATES HOOK
// Provides optimistic UI updates with automatic rollback
// ============================================

interface OptimisticConfig<T> {
  queryKey: QueryKey;
  updateFn: (oldData: T | undefined, variables: unknown) => T;
  rollbackOnError?: boolean;
}

export function useOptimisticMutation<T, TVariables = unknown>(
  config: OptimisticConfig<T>,
  mutationFn: (variables: TVariables) => Promise<T>
) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<T | undefined>();

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    // Store previous data for rollback
    previousDataRef.current = queryClient.getQueryData<T>(config.queryKey);

    // Optimistically update the cache
    queryClient.setQueryData<T>(config.queryKey, (oldData) => 
      config.updateFn(oldData, variables)
    );

    try {
      const result = await mutationFn(variables);
      
      // Update with actual server response
      queryClient.setQueryData(config.queryKey, result);
      
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      
      // Rollback on error
      if (config.rollbackOnError !== false) {
        queryClient.setQueryData(config.queryKey, previousDataRef.current);
      }
      
      setIsLoading(false);
      throw err;
    }
  }, [queryClient, config, mutationFn]);

  const rollback = useCallback(() => {
    if (previousDataRef.current !== undefined) {
      queryClient.setQueryData(config.queryKey, previousDataRef.current);
    }
  }, [queryClient, config.queryKey]);

  return {
    mutate,
    isLoading,
    error,
    rollback,
  };
}

// ============================================
// OPTIMISTIC LIST OPERATIONS
// Common patterns for list data
// ============================================

export function createOptimisticListHelpers<T extends { id: string }>(queryKey: QueryKey) {
  return {
    // Add item to the beginning of the list
    addItem: (item: T) => ({
      queryKey,
      updateFn: (oldData: T[] | undefined) => [item, ...(oldData || [])],
    }),

    // Add item to the end of the list
    appendItem: (item: T) => ({
      queryKey,
      updateFn: (oldData: T[] | undefined) => [...(oldData || []), item],
    }),

    // Update an existing item
    updateItem: (id: string) => ({
      queryKey,
      updateFn: (oldData: T[] | undefined, variables: Partial<T>) => 
        (oldData || []).map(item => 
          item.id === id ? { ...item, ...variables } : item
        ),
    }),

    // Remove an item
    removeItem: (id: string) => ({
      queryKey,
      updateFn: (oldData: T[] | undefined) => 
        (oldData || []).filter(item => item.id !== id),
    }),

    // Toggle a boolean property
    toggleProperty: (id: string, property: keyof T) => ({
      queryKey,
      updateFn: (oldData: T[] | undefined) => 
        (oldData || []).map(item => 
          item.id === id 
            ? { ...item, [property]: !item[property] } 
            : item
        ),
    }),

    // Reorder items (for drag and drop)
    reorderItems: () => ({
      queryKey,
      updateFn: (oldData: T[] | undefined, { fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
        if (!oldData) return [];
        const result = [...oldData];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return result;
      },
    }),
  };
}

// ============================================
// OPTIMISTIC COUNTER
// For like/favorite/vote counters
// ============================================

interface OptimisticCounterConfig {
  queryKey: QueryKey;
  countField: string;
  toggleField?: string;
}

export function useOptimisticCounter<T extends { id: string }>(
  config: OptimisticCounterConfig
) {
  const queryClient = useQueryClient();
  const previousDataRef = useRef<T[] | undefined>();

  const increment = useCallback((itemId: string) => {
    previousDataRef.current = queryClient.getQueryData<T[]>(config.queryKey);
    
    queryClient.setQueryData<T[]>(config.queryKey, (oldData) => 
      (oldData || []).map((item) => 
        item.id === itemId
          ? {
              ...item,
              [config.countField]: ((item as Record<string, unknown>)[config.countField] as number) + 1,
              ...(config.toggleField ? { [config.toggleField]: true } : {}),
            }
          : item
      )
    );
  }, [queryClient, config]);

  const decrement = useCallback((itemId: string) => {
    previousDataRef.current = queryClient.getQueryData<T[]>(config.queryKey);
    
    queryClient.setQueryData<T[]>(config.queryKey, (oldData) => 
      (oldData || []).map((item) => 
        item.id === itemId
          ? {
              ...item,
              [config.countField]: Math.max(0, ((item as Record<string, unknown>)[config.countField] as number) - 1),
              ...(config.toggleField ? { [config.toggleField]: false } : {}),
            }
          : item
      )
    );
  }, [queryClient, config]);

  const toggle = useCallback((itemId: string, isCurrentlyActive: boolean) => {
    if (isCurrentlyActive) {
      decrement(itemId);
    } else {
      increment(itemId);
    }
  }, [increment, decrement]);

  const rollback = useCallback(() => {
    if (previousDataRef.current !== undefined) {
      queryClient.setQueryData(config.queryKey, previousDataRef.current);
    }
  }, [queryClient, config.queryKey]);

  return { increment, decrement, toggle, rollback };
}

export default useOptimisticMutation;
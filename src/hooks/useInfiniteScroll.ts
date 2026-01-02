import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef, useCallback } from 'react';

interface InfiniteScrollOptions {
  pageSize?: number;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Record<string, any>;
}

export function useInfiniteScroll<T>(
  table: string,
  queryKey: string[],
  options: InfiniteScrollOptions = {}
) {
  const { pageSize = 20, orderBy, filters } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: [...queryKey, filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let q = supabase.from(table).select('*', { count: 'exact' });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            q = q.eq(key, value);
          }
        });
      }

      if (orderBy) {
        q = q.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }

      q = q.range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      const { data, error, count } = await q;
      if (error) throw error;

      return { data: data as T[], nextPage: pageParam + 1, totalCount: count || 0, hasMore: (data?.length || 0) === pageSize };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
  });

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    
    if (node && query.hasNextPage && !query.isFetchingNextPage) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          query.fetchNextPage();
        }
      }, { threshold: 0.1 });
      
      observerRef.current.observe(node);
    }
    
    loadMoreRef.current = node;
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const allData = query.data?.pages.flatMap(page => page.data) ?? [];
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  return {
    data: allData,
    totalCount,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    setLoadMoreRef,
    refetch: query.refetch,
  };
}

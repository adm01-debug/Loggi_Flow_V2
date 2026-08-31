import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

/**
 * Green Tech Optimization:
 * Reduces server load and network traffic by applying aggressive caching
 * for data that changes infrequently.
 */
export function useMemoizedQuery<TData, TError = Error>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: QUERY_STALE_TIME.STATIC, // Default to 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    ...options,
  });
}

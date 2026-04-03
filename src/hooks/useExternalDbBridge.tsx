import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to interact with the external-db-bridge edge function.
 * This function proxies queries to the external database with 
 * telemetry logging (slow query detection, error tracking).
 */
export function useExternalDbBridge() {
  const query = useMutation({
    mutationFn: async (params: {
      operation: string;
      table?: string;
      rpcName?: string;
      filters?: Record<string, unknown>;
      limit?: number;
      offset?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('external-db-bridge', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onError: (e: Error) => toast.error(`Erro no banco externo: ${e.message}`),
  });

  return {
    queryExternalDb: query.mutate,
    queryExternalDbAsync: query.mutateAsync,
    isQuerying: query.isPending,
    result: query.data,
    error: query.error,
  };
}

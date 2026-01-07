import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const BITRIX_WEBHOOK = import.meta.env.VITE_BITRIX24_WEBHOOK || '';

interface Bitrix24Entity { ID: string; [key: string]: unknown; }
interface Bitrix24Response<T> { result: T; total?: number; next?: number; }

async function callBitrix24<T>(method: string, params: Record<string, unknown> = {}): Promise<Bitrix24Response<T>> {
  const response = await fetch(`${BITRIX_WEBHOOK}${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`Bitrix24 API error: ${response.status}`);
  return response.json();
}

export function useBitrix24SPA(entityTypeId: number) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['bitrix24-spa', entityTypeId],
    queryFn: async () => {
      const response = await callBitrix24<{ items: Bitrix24Entity[] }>('crm.item.list', { entityTypeId, select: ['*', 'UF_*'], order: { id: 'DESC' } });
      return response.result.items || [];
    },
    staleTime: 60000,
  });

  const getItem = async (id: string) => {
    const response = await callBitrix24<{ item: Bitrix24Entity }>('crm.item.get', { entityTypeId, id });
    return response.result.item;
  };

  const createMutation = useMutation({
    mutationFn: async (fields: Record<string, unknown>) => {
      const response = await callBitrix24<{ item: Bitrix24Entity }>('crm.item.add', { entityTypeId, fields });
      return response.result.item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Record<string, unknown> }) => { await callBitrix24('crm.item.update', { entityTypeId, id, fields }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await callBitrix24('crm.item.delete', { entityTypeId, id }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  const moveToStageMutation = useMutation({
    mutationFn: async ({ id, stageId }: { id: string; stageId: string }) => { await callBitrix24('crm.item.update', { entityTypeId, id, fields: { stageId } }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  return {
    items: listQuery.data || [], isLoading: listQuery.isLoading, error: listQuery.error, getItem,
    create: createMutation.mutateAsync, update: updateMutation.mutate, delete: deleteMutation.mutate,
    moveToStage: moveToStageMutation.mutate, refetch: listQuery.refetch,
  };
}

export function useBitrix24Lalamove() { return useBitrix24SPA(1690); }
export function useBitrix24Expedicao() { return useBitrix24SPA(1502); }

export function useBitrix24Sync(entityTypeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await callBitrix24<{ items: Bitrix24Entity[] }>('crm.item.list', { entityTypeId, select: ['*', 'UF_*'] });
      return { synced: response.result.items?.length || 0 };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }); },
  });
}

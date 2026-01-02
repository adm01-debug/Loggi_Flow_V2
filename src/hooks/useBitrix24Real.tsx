import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Webhook do Bitrix24 (via env ou Supabase Vault)
const BITRIX_WEBHOOK = import.meta.env.VITE_BITRIX24_WEBHOOK || '';

interface Bitrix24Entity {
  ID: string;
  [key: string]: any;
}

interface Bitrix24Response<T> {
  result: T;
  total?: number;
  next?: number;
}

// Função genérica para chamar API Bitrix24
async function callBitrix24<T>(method: string, params: Record<string, any> = {}): Promise<Bitrix24Response<T>> {
  const url = `${BITRIX_WEBHOOK}${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) throw new Error(`Bitrix24 API error: ${response.status}`);
  return response.json();
}

// Hook para SPA Items (Smart Process)
export function useBitrix24SPA(entityTypeId: number) {
  const queryClient = useQueryClient();

  // Listar items
  const listQuery = useQuery({
    queryKey: ['bitrix24-spa', entityTypeId],
    queryFn: async () => {
      const response = await callBitrix24<{ items: Bitrix24Entity[] }>('crm.item.list', {
        entityTypeId,
        select: ['*', 'UF_*'],
        order: { id: 'DESC' },
      });
      return response.result.items || [];
    },
    staleTime: 60000,
  });

  // Buscar item por ID
  const getItem = async (id: string) => {
    const response = await callBitrix24<{ item: Bitrix24Entity }>('crm.item.get', {
      entityTypeId,
      id,
    });
    return response.result.item;
  };

  // Criar item
  const createMutation = useMutation({
    mutationFn: async (fields: Record<string, any>) => {
      const response = await callBitrix24<{ item: Bitrix24Entity }>('crm.item.add', {
        entityTypeId,
        fields,
      });
      return response.result.item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  // Atualizar item
  const updateMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Record<string, any> }) => {
      await callBitrix24('crm.item.update', { entityTypeId, id, fields });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  // Deletar item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await callBitrix24('crm.item.delete', { entityTypeId, id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  // Mover para estágio
  const moveToStageMutation = useMutation({
    mutationFn: async ({ id, stageId }: { id: string; stageId: string }) => {
      await callBitrix24('crm.item.update', {
        entityTypeId,
        id,
        fields: { stageId },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] }),
  });

  return {
    items: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    getItem,
    create: createMutation.mutateAsync,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    moveToStage: moveToStageMutation.mutate,
    refetch: listQuery.refetch,
  };
}

// Hook específico para SPA LALAMOVE (EntityTypeId=1690)
export function useBitrix24Lalamove() {
  return useBitrix24SPA(1690);
}

// Hook específico para SPA EXPEDIÇÃO (EntityTypeId=1502)
export function useBitrix24Expedicao() {
  return useBitrix24SPA(1502);
}

// Hook para sincronizar Bitrix24 com Supabase
export function useBitrix24Sync(entityTypeId: number, supabaseTable: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Buscar do Bitrix24
      const response = await callBitrix24<{ items: Bitrix24Entity[] }>('crm.item.list', {
        entityTypeId,
        select: ['*', 'UF_*'],
      });

      const items = response.result.items || [];

      // Sincronizar com Supabase
      for (const item of items) {
        await supabase.from(supabaseTable).upsert({
          bitrix_id: item.ID,
          data: item,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'bitrix_id' });
      }

      return { synced: items.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24-spa', entityTypeId] });
    },
  });
}

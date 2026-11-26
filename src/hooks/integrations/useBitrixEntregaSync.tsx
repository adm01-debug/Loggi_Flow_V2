import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EntregaForSync {
  id: string;
  numero_entrega: string;
  status: string;
  endereco_entrega: string;
  valor_frete?: number | null;
  previsao_entrega?: string | null;
  data_entrega_efetiva?: string | null;
  transportadora_nome?: string;
  cliente_nome?: string;
}

export const useBitrixEntregaSync = () => {
  const syncEntregaToBitrix = useMutation({
    mutationFn: async (entrega: EntregaForSync) => {
      const statusMap: Record<string, string> = {
        'pendente': 'NEW',
        'despachado': 'PREPARATION',
        'em_transito': 'EXECUTING',
        'saiu_entrega': 'EXECUTING',
        'entregue': 'WON',
        'cancelado': 'LOSE',
        'devolvido': 'LOSE',
      };

      const { data, error } = await supabase.functions.invoke('bitrix24-integration', {
        body: {
          action: 'sync_deals',
          data: {
            TITLE: `Entrega ${entrega.numero_entrega}`,
            STAGE_ID: statusMap[entrega.status] || 'NEW',
            OPPORTUNITY: entrega.valor_frete || 0,
            CURRENCY_ID: 'BRL',
            COMMENTS: [
              `Nº: ${entrega.numero_entrega}`,
              `Status: ${entrega.status}`,
              `Endereço: ${entrega.endereco_entrega}`,
              entrega.transportadora_nome ? `Transportadora: ${entrega.transportadora_nome}` : '',
              entrega.cliente_nome ? `Cliente: ${entrega.cliente_nome}` : '',
              entrega.previsao_entrega ? `Previsão: ${entrega.previsao_entrega}` : '',
              entrega.data_entrega_efetiva ? `Entregue em: ${entrega.data_entrega_efetiva}` : '',
            ].filter(Boolean).join('\n'),
            UF_CRM_NUMERO_ENTREGA: entrega.numero_entrega,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Entrega sincronizada com Bitrix24!');
    },
    onError: (error) => {
      toast.error('Erro ao sincronizar com Bitrix24', {
        description: error.message,
      });
    },
  });

  const updateEntregaInBitrix = useMutation({
    mutationFn: async ({ dealId, entrega }: { dealId: string; entrega: EntregaForSync }) => {
      const statusMap: Record<string, string> = {
        'pendente': 'NEW',
        'despachado': 'PREPARATION',
        'em_transito': 'EXECUTING',
        'saiu_entrega': 'EXECUTING',
        'entregue': 'WON',
        'cancelado': 'LOSE',
        'devolvido': 'LOSE',
      };

      const { data, error } = await supabase.functions.invoke('bitrix24-integration', {
        body: {
          action: 'update_deal',
          data: {
            id: dealId,
            fields: {
              STAGE_ID: statusMap[entrega.status] || 'NEW',
              OPPORTUNITY: entrega.valor_frete || 0,
              COMMENTS: `Status atualizado: ${entrega.status}`,
            },
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Entrega atualizada no Bitrix24!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar no Bitrix24', {
        description: error.message,
      });
    },
  });

  return {
    syncEntregaToBitrix,
    updateEntregaInBitrix,
    isSyncing: syncEntregaToBitrix.isPending || updateEntregaInBitrix.isPending,
  };
};

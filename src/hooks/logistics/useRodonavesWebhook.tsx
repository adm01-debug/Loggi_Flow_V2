import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebhookPayload {
  nf_numero?: string;
  status_code: string | number;
  status_descricao?: string;
  data_evento?: string;
  codigo_rastreamento?: string;
  recebedor?: string;
}

/**
 * Hook to interact with the rodonaves-webhook edge function.
 * Used for simulating/testing webhook callbacks from Rodonaves
 * that update delivery statuses automatically.
 */
export function useRodonavesWebhook() {
  const simulateWebhook = useMutation({
    mutationFn: async (payload: WebhookPayload) => {
      const { data, error } = await supabase.functions.invoke('rodonaves-webhook', {
        body: payload,
      });
      if (error) throw error;
      return data as { success: boolean; entrega_id?: string; new_status?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Status atualizado para: ${data.new_status}`);
      }
    },
    onError: (e: Error) => toast.error(`Erro no webhook: ${e.message}`),
  });

  return {
    simulateWebhook,
    isSimulating: simulateWebhook.isPending,
  };
}

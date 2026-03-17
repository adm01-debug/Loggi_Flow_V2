import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendCotacaoParams {
  instance: string;
  phone: string;
  transportadora?: string;
  origem?: string;
  destino?: string;
  peso?: string;
  volumes?: string;
  valor_mercadoria?: string;
}

interface SendTextParams {
  instance: string;
  phone: string;
  message: string;
}

export const useEvolutionWhatsApp = () => {
  const sendText = useMutation({
    mutationFn: async (params: SendTextParams) => {
      const { data, error } = await supabase.functions.invoke('evolution-whatsapp', {
        body: { action: 'send_text', data: params },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar mensagem');
      return data;
    },
    onSuccess: () => {
      toast.success('Mensagem WhatsApp enviada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar WhatsApp', { description: error.message });
    },
  });

  const sendCotacao = useMutation({
    mutationFn: async (params: SendCotacaoParams) => {
      const { data, error } = await supabase.functions.invoke('evolution-whatsapp', {
        body: { action: 'send_cotacao', data: params },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar cotação');
      return data;
    },
    onSuccess: () => {
      toast.success('Cotação enviada via WhatsApp automaticamente!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar cotação via WhatsApp', { description: error.message });
    },
  });

  const checkStatus = useMutation({
    mutationFn: async (instance: string) => {
      const { data, error } = await supabase.functions.invoke('evolution-whatsapp', {
        body: { action: 'check_status', data: { instance } },
      });
      if (error) throw error;
      return data;
    },
  });

  return {
    sendText,
    sendCotacao,
    checkStatus,
    isSending: sendText.isPending || sendCotacao.isPending,
  };
};

import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const N8N_WEBHOOK_BASE = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface N8nWorkflow {
  id: string;
  name: string;
  webhookUrl: string;
  description?: string;
  isActive: boolean;
}

// Chamar webhook n8n
async function callN8nWebhook(path: string, data: any): Promise<WebhookResponse> {
  const response = await fetch(`${N8N_WEBHOOK_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`n8n webhook error: ${response.status}`);
  }

  return response.json();
}

// Hook para workflows cadastrados
export function useN8nWorkflows() {
  return useQuery({
    queryKey: ['n8n-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_workflows')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as N8nWorkflow[];
    },
  });
}

// Hook para disparar workflows
export function useN8nTrigger() {
  // Notificação de nova entrega
  const notifyNewDeliveryMutation = useMutation({
    mutationFn: async (entrega: { id: string; numero_nf: string; cliente: string; endereco: string }) => {
      return callN8nWebhook('/nova-entrega', entrega);
    },
    onSuccess: () => toast.success('Notificação enviada!'),
    onError: () => toast.error('Erro ao enviar notificação'),
  });

  // Alerta de SLA
  const alertSLAMutation = useMutation({
    mutationFn: async (data: { entrega_id: string; minutos_atraso: number; cliente: string }) => {
      return callN8nWebhook('/alerta-sla', data);
    },
  });

  // Sincronizar com Bitrix24
  const syncBitrix24Mutation = useMutation({
    mutationFn: async (data: { entity_type: string; entity_id: string; action: string }) => {
      return callN8nWebhook('/sync-bitrix24', data);
    },
  });

  // Enviar relatório diário
  const sendDailyReportMutation = useMutation({
    mutationFn: async (data: { email: string; date: string }) => {
      return callN8nWebhook('/relatorio-diario', data);
    },
    onSuccess: () => toast.success('Relatório enviado!'),
  });

  // Notificação WhatsApp
  const sendWhatsAppMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string; template?: string }) => {
      return callN8nWebhook('/whatsapp', data);
    },
  });

  return {
    notifyNewDelivery: notifyNewDeliveryMutation.mutate,
    alertSLA: alertSLAMutation.mutate,
    syncBitrix24: syncBitrix24Mutation.mutate,
    sendDailyReport: sendDailyReportMutation.mutate,
    sendWhatsApp: sendWhatsAppMutation.mutate,
    isLoading: notifyNewDeliveryMutation.isPending || alertSLAMutation.isPending,
  };
}

// Hook para logs de execução
export function useN8nLogs(limit = 50) {
  return useQuery({
    queryKey: ['n8n-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_execution_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseN8nOptions {
  webhookUrl?: string;
}

interface N8nWorkflowData {
  [key: string]: unknown;
}

const STORAGE_KEY = 'n8n_webhook_url';

export function useN8n(options: UseN8nOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrlState] = useState<string>(
    options.webhookUrl || localStorage.getItem(STORAGE_KEY) || ''
  );

  const setWebhookUrl = useCallback((url: string) => {
    localStorage.setItem(STORAGE_KEY, url);
    setWebhookUrlState(url);
  }, []);

  const isConfigured = !!webhookUrl;

  const triggerWorkflow = useCallback(async (
    data?: N8nWorkflowData,
    customWebhookUrl?: string,
    waitForResponse = false
  ) => {
    const url = customWebhookUrl || webhookUrl;
    
    if (!url) {
      toast.error('n8n não configurado. Configure a URL do webhook nas configurações.');
      return null;
    }

    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('n8n-integration', {
        body: { 
          webhookUrl: url, 
          data,
          waitForResponse,
        },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      toast.success('Workflow n8n disparado!');
      return result;
    } catch (error) {
      toast.error(`Erro n8n: ${(error as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [webhookUrl]);

  // Pre-built workflow triggers for common logistics events
  const triggerNewDelivery = useCallback(async (deliveryData: {
    id: string;
    numero_entrega: string;
    cliente?: string;
    endereco: string;
    status: string;
  }) => {
    return triggerWorkflow({
      event: 'new_delivery',
      ...deliveryData,
    });
  }, [triggerWorkflow]);

  const triggerStatusChange = useCallback(async (data: {
    entityType: 'entrega' | 'coleta';
    entityId: string;
    oldStatus: string;
    newStatus: string;
    timestamp: string;
  }) => {
    return triggerWorkflow({
      event: 'status_change',
      ...data,
    });
  }, [triggerWorkflow]);

  const triggerOcorrencia = useCallback(async (data: {
    tipo: string;
    descricao: string;
    entrega_id?: string;
    coleta_id?: string;
    fotos?: string[];
  }) => {
    return triggerWorkflow({
      event: 'ocorrencia',
      ...data,
    });
  }, [triggerWorkflow]);

  const triggerSLAAlert = useCallback(async (data: {
    entityType: 'entrega' | 'coleta';
    entityId: string;
    severity: 'warning' | 'critical';
    hoursRemaining: number;
    deadline: string;
  }) => {
    return triggerWorkflow({
      event: 'sla_alert',
      ...data,
    });
  }, [triggerWorkflow]);

  const testConnection = useCallback(async () => {
    if (!webhookUrl) {
      toast.error('Configure a URL do webhook primeiro.');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await triggerWorkflow({ 
        event: 'test_connection',
        timestamp: new Date().toISOString(),
      }, webhookUrl, true);
      
      if (result?.success) {
        toast.success('Conexão com n8n OK!');
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [webhookUrl, triggerWorkflow]);

  return {
    isConfigured,
    isLoading,
    webhookUrl,
    setWebhookUrl,
    triggerWorkflow,
    triggerNewDelivery,
    triggerStatusChange,
    triggerOcorrencia,
    triggerSLAAlert,
    testConnection,
  };
}

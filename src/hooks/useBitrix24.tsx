import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Bitrix24LeadData {
  title?: string;
  name?: string;
  phone?: string;
  email?: string;
  comments?: string;
  customFields?: Record<string, unknown>;
}

interface Bitrix24DealData {
  title?: string;
  value?: number;
  stage?: string;
  comments?: string;
  contactId?: string;
  companyId?: string;
  customFields?: Record<string, unknown>;
}

interface Bitrix24TaskData {
  title?: string;
  description?: string;
  responsibleId?: number;
  deadline?: string;
  priority?: number;
  customFields?: Record<string, unknown>;
}

interface UseBitrix24Options {
  webhookUrl?: string;
}

const STORAGE_KEY = 'bitrix24_webhook_url';

export function useBitrix24(options: UseBitrix24Options = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrlState] = useState<string>(
    options.webhookUrl || localStorage.getItem(STORAGE_KEY) || ''
  );

  const setWebhookUrl = useCallback((url: string) => {
    localStorage.setItem(STORAGE_KEY, url);
    setWebhookUrlState(url);
  }, []);

  const isConfigured = !!webhookUrl;

  const callBitrix24 = useCallback(async (
    action: 'create_lead' | 'create_deal' | 'create_task' | 'add_comment' | 'get_contacts',
    data?: Record<string, unknown>
  ) => {
    if (!webhookUrl) {
      toast.error('Bitrix24 não configurado. Configure a URL do webhook nas configurações.');
      return null;
    }

    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('bitrix24-integration', {
        body: { webhookUrl, action, data },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      return result.data;
    } catch (error) {
      console.error('Bitrix24 error:', error);
      toast.error(`Erro Bitrix24: ${(error as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [webhookUrl]);

  const createLead = useCallback(async (data: Bitrix24LeadData) => {
    const result = await callBitrix24('create_lead', data as unknown as Record<string, unknown>);
    if (result) {
      toast.success('Lead criada no Bitrix24!');
    }
    return result;
  }, [callBitrix24]);

  const createDeal = useCallback(async (data: Bitrix24DealData) => {
    const result = await callBitrix24('create_deal', data as unknown as Record<string, unknown>);
    if (result) {
      toast.success('Negócio criado no Bitrix24!');
    }
    return result;
  }, [callBitrix24]);

  const createTask = useCallback(async (data: Bitrix24TaskData) => {
    const result = await callBitrix24('create_task', data as unknown as Record<string, unknown>);
    if (result) {
      toast.success('Tarefa criada no Bitrix24!');
    }
    return result;
  }, [callBitrix24]);

  const getContacts = useCallback(async (filter?: Record<string, unknown>) => {
    return await callBitrix24('get_contacts', { filter });
  }, [callBitrix24]);

  const testConnection = useCallback(async () => {
    if (!webhookUrl) {
      toast.error('Configure a URL do webhook primeiro.');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await callBitrix24('get_contacts', { filter: {}, start: 0 });
      if (result !== null) {
        toast.success('Conexão com Bitrix24 OK!');
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [webhookUrl, callBitrix24]);

  return {
    isConfigured,
    isLoading,
    webhookUrl,
    setWebhookUrl,
    createLead,
    createDeal,
    createTask,
    getContacts,
    testConnection,
  };
}

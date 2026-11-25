import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from 'sonner';

export interface ClientWebhook {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  secret: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  response_status: number | null;
  error_message: string | null;
  success: boolean;
  created_at: string;
}

export interface WebhookInboundFailure {
  id: string;
  receiver: string;
  provider: string | null;
  event_id: string | null;
  response_status: number;
  error_message: string;
  created_at: string;
}

export function useClientWebhooks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['client-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClientWebhook[];
    },
    enabled: !!user?.id,
  });

  const { data: deliveries = [], isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['webhook-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as WebhookDelivery[];
    },
    enabled: !!user?.id,
  });

  const {
    data: inboundFailures = [],
    isLoading: isLoadingInboundFailures,
    isError: isErrorInboundFailures,
  } = useQuery({
    queryKey: ['webhook-inbound-failures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_inbound_failures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WebhookInboundFailure[];
    },
    enabled: !!user?.id,
  });

  const createWebhook = useMutation({
    mutationFn: async (data: { url: string; description: string; events: string[] }) => {
      const { error } = await supabase.from('client_webhooks').insert({
        url: data.url,
        description: data.description,
        events: data.events,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      toast.success('Webhook criado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('client_webhooks')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      toast.success('Webhook atualizado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      toast.success('Webhook removido!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkWebhookStatus = useMutation({
    mutationFn: async (webhookId: string) => {
      const { data, error } = await supabase.functions.invoke('webhook-status', {
        body: { webhookId },
      });
      if (error) throw error;
      return data;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    webhooks,
    deliveries,
    inboundFailures,
    isLoading,
    isLoadingDeliveries,
    isLoadingInboundFailures,
    isErrorInboundFailures,
    createWebhook,
    toggleWebhook,
    deleteWebhook,
    checkWebhookStatus,
  };
}

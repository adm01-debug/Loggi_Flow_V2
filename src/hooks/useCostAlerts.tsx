import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect, useState, useCallback } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface AlertaCusto {
  id: string;
  tipo: 'transportadora' | 'rota' | 'global';
  transportadora_id: string | null;
  estado_destino: string | null;
  limite_mensal: number;
  limite_por_entrega: number | null;
  ativo: boolean;
  notificar_percentual: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  transportadora?: {
    id: string;
    nome_fantasia: string;
  };
}

export interface NotificacaoCusto {
  id: string;
  alerta_id: string;
  tipo_notificacao: 'warning' | 'critical' | 'exceeded';
  mensagem: string;
  valor_atual: number;
  limite: number;
  percentual_atingido: number;
  lida: boolean;
  created_at: string;
}

export interface CostCheckResult {
  alerta: AlertaCusto;
  valor_atual: number;
  percentual: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
}

export const useCostAlerts = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [costCheckResults, setCostCheckResults] = useState<CostCheckResult[]>([]);

  // Fetch all cost alerts
  const { data: alertas, isLoading: isLoadingAlertas } = useQuery({
    queryKey: ['alertas-custo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertas_custo')
        .select(`
          *,
          transportadora:transportadoras(id, nome_fantasia)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AlertaCusto[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  // Fetch unread notifications
  const { data: notificacoes, refetch: refetchNotificacoes } = useQuery({
    queryKey: ['notificacoes-custo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes_custo')
        .select('*')
        .eq('lida', false)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as NotificacaoCusto[];
    },
    staleTime: 60 * 1000,
    enabled: !!user?.id,
  });

  // Fetch transportadoras for dropdown
  const { data: transportadoras } = useQuery({
    queryKey: ['transportadoras-alertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('id, nome_fantasia')
        .eq('homologada', true)
        .order('nome_fantasia');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Check costs against limits
  const checkCosts = useCallback(async () => {
    if (!alertas || alertas.length === 0) return;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Fetch current month deliveries
    const { data: entregas, error } = await supabase
      .from('entregas')
      .select(`
        id,
        valor_frete,
        transportadora_id,
        cliente:clientes(estado)
      `)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())
      .not('valor_frete', 'is', null);

    if (error) {
      return;
    }

    const results: CostCheckResult[] = [];

    for (const alerta of alertas.filter(a => a.ativo)) {
      let valorAtual = 0;

      if (alerta.tipo === 'transportadora' && alerta.transportadora_id) {
        valorAtual = entregas
          .filter(e => e.transportadora_id === alerta.transportadora_id)
          .reduce((sum, e) => sum + (Number(e.valor_frete) || 0), 0);
      } else if (alerta.tipo === 'rota' && alerta.estado_destino) {
        valorAtual = entregas
          .filter(e => e.cliente?.estado === alerta.estado_destino)
          .reduce((sum, e) => sum + (Number(e.valor_frete) || 0), 0);
      } else if (alerta.tipo === 'global') {
        valorAtual = entregas
          .reduce((sum, e) => sum + (Number(e.valor_frete) || 0), 0);
      }

      const percentual = (valorAtual / alerta.limite_mensal) * 100;
      
      let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';
      if (percentual >= 100) {
        status = 'exceeded';
      } else if (percentual >= 95) {
        status = 'critical';
      } else if (percentual >= alerta.notificar_percentual) {
        status = 'warning';
      }

      results.push({
        alerta,
        valor_atual: valorAtual,
        percentual,
        status,
      });
    }

    setCostCheckResults(results);
    return results;
  }, [alertas]);

  // Run cost check on mount and when alertas change
  useEffect(() => {
    checkCosts();
  }, [checkCosts]);

  // Listen for realtime notifications
  useEffect(() => {
    const channel = supabase
      .channel('cost-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes_custo',
        },
        (payload) => {
          const notif = payload.new as NotificacaoCusto;
          
          // Show toast based on type
          if (notif.tipo_notificacao === 'exceeded') {
            toast.error(notif.mensagem, {
              duration: 10000,
              icon: '🚨',
            });
          } else if (notif.tipo_notificacao === 'critical') {
            toast.warning(notif.mensagem, {
              duration: 8000,
              icon: '⚠️',
            });
          } else {
            toast.info(notif.mensagem, {
              duration: 5000,
              icon: '💰',
            });
          }

          refetchNotificacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchNotificacoes]);

  // Create alert
  const createAlerta = useMutation({
    mutationFn: async (data: Omit<AlertaCusto, 'id' | 'created_at' | 'updated_at' | 'transportadora'>) => {
      const { data: result, error } = await supabase
        .from('alertas_custo')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-custo'] });
      toast.success('Alerta de custo criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar alerta: ' + error.message);
    },
  });

  // Update alert
  const updateAlerta = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AlertaCusto> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('alertas_custo')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-custo'] });
      toast.success('Alerta atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar alerta: ' + error.message);
    },
  });

  // Delete alert
  const deleteAlerta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alertas_custo')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-custo'] });
      toast.success('Alerta removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover alerta: ' + error.message);
    },
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notificacoes_custo')
        .update({ lida: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-custo'] });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notificacoes_custo')
        .update({ lida: true })
        .eq('lida', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-custo'] });
      toast.success('Todas as notificações marcadas como lidas');
    },
  });

  // Generate notification for an alert
  const generateNotification = useMutation({
    mutationFn: async (result: CostCheckResult) => {
      if (result.status === 'ok') return null;

      let tipoNotificacao: 'warning' | 'critical' | 'exceeded' = 'warning';
      let mensagem = '';

      const nome = result.alerta.tipo === 'transportadora' 
        ? result.alerta.transportadora?.nome_fantasia 
        : result.alerta.tipo === 'rota' 
          ? `Rota ${result.alerta.estado_destino}` 
          : 'Total Geral';

      if (result.status === 'exceeded') {
        tipoNotificacao = 'exceeded';
        mensagem = `🚨 LIMITE EXCEDIDO: ${nome} atingiu ${result.percentual.toFixed(1)}% do limite mensal (R$ ${result.valor_atual.toFixed(2)} de R$ ${result.alerta.limite_mensal.toFixed(2)})`;
      } else if (result.status === 'critical') {
        tipoNotificacao = 'critical';
        mensagem = `⚠️ ALERTA CRÍTICO: ${nome} está em ${result.percentual.toFixed(1)}% do limite mensal`;
      } else {
        mensagem = `💰 Atenção: ${nome} atingiu ${result.percentual.toFixed(1)}% do limite de custo mensal`;
      }

      const { data, error } = await supabase
        .from('notificacoes_custo')
        .insert({
          alerta_id: result.alerta.id,
          tipo_notificacao: tipoNotificacao,
          mensagem,
          valor_atual: result.valor_atual,
          limite: result.alerta.limite_mensal,
          percentual_atingido: result.percentual,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  return {
    alertas,
    notificacoes,
    transportadoras,
    costCheckResults,
    isLoadingAlertas,
    checkCosts,
    createAlerta,
    updateAlerta,
    deleteAlerta,
    markAsRead,
    markAllAsRead,
    generateNotification,
  };
};

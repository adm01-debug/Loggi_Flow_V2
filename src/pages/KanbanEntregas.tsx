import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Package, Send, Truck, CheckCircle2, AlertTriangle, Clock,
  FileText, DollarSign, GripVertical, ArrowRight, Eye, RefreshCw,
  Kanban as KanbanIcon, List
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import type { LucideIcon } from 'lucide-react';

type EntregaStatus = 'aguardando_producao' | 'pronto_despacho' | 'cotacao_frete' | 'nf_emitida' | 'despachado' | 'em_transito' | 'saiu_entrega' | 'entregue' | 'ocorrencia' | 'finalizado';

interface KanbanEntrega {
  id: string;
  numero_entrega: string;
  status: EntregaStatus;
  endereco_entrega: string;
  previsao_entrega: string | null;
  valor_frete: number | null;
  nf_remessa: string | null;
  created_at: string;
  cliente: { razao_social: string; nome_fantasia: string | null } | null;
  transportadora: { nome_fantasia: string } | null;
}

interface KanbanColumn {
  id: EntregaStatus;
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const COLUMNS: KanbanColumn[] = [
  { id: 'aguardando_producao', title: 'Aguard. Produção', icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  { id: 'pronto_despacho', title: 'Pronto Despacho', icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/5' },
  { id: 'cotacao_frete', title: 'Cotação Frete', icon: DollarSign, color: 'text-purple-500', bgColor: 'bg-purple-500/5' },
  { id: 'nf_emitida', title: 'NF Emitida', icon: FileText, color: 'text-indigo-500', bgColor: 'bg-indigo-500/5' },
  { id: 'despachado', title: 'Despachado', icon: Send, color: 'text-primary', bgColor: 'bg-primary/5' },
  { id: 'em_transito', title: 'Em Trânsito', icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/5' },
  { id: 'saiu_entrega', title: 'Saiu p/ Entrega', icon: Truck, color: 'text-orange-500', bgColor: 'bg-orange-500/5' },
  { id: 'entregue', title: 'Entregue', icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/5' },
];

const VALID_TRANSITIONS: Record<EntregaStatus, EntregaStatus[]> = {
  aguardando_producao: ['pronto_despacho'],
  pronto_despacho: ['cotacao_frete', 'aguardando_producao'],
  cotacao_frete: ['nf_emitida', 'pronto_despacho'],
  nf_emitida: ['despachado', 'cotacao_frete'],
  despachado: ['em_transito'],
  em_transito: ['saiu_entrega', 'ocorrencia'],
  saiu_entrega: ['entregue', 'ocorrencia'],
  entregue: ['finalizado'],
  ocorrencia: ['em_transito', 'saiu_entrega'],
  finalizado: [],
};

function EntregaCard({ entrega, onMoveForward, onMoveBack, isUpdating }: {
  entrega: KanbanEntrega;
  onMoveForward: () => void;
  onMoveBack: () => void;
  isUpdating: boolean;
}) {
  const nextStatuses = VALID_TRANSITIONS[entrega.status] || [];
  const canGoForward = nextStatuses.length > 0;
  const prevStatuses = Object.entries(VALID_TRANSITIONS)
    .filter(([, nexts]) => nexts.includes(entrega.status))
    .map(([status]) => status);
  const canGoBack = prevStatuses.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="font-mono text-xs font-bold text-primary">{entrega.numero_entrega}</span>
        </div>
        {entrega.valor_frete && (
          <Badge variant="outline" className="text-[10px] h-5">
            R$ {entrega.valor_frete.toFixed(0)}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground truncate mb-1">
        {entrega.cliente?.nome_fantasia || entrega.cliente?.razao_social || 'Sem cliente'}
      </p>

      <p className="text-[11px] text-muted-foreground/70 truncate mb-2">
        {entrega.endereco_entrega.length > 35
          ? entrega.endereco_entrega.substring(0, 35) + '…'
          : entrega.endereco_entrega}
      </p>

      {entrega.transportadora && (
        <div className="flex items-center gap-1 mb-2">
          <Truck className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground">{entrega.transportadora.nome_fantasia}</span>
        </div>
      )}

      {entrega.previsao_entrega && (
        <div className="flex items-center gap-1 mb-2">
          <Clock className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(entrega.previsao_entrega), 'dd/MM', { locale: ptBR })}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-1 pt-2 border-t">
        {canGoBack ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-2"
            onClick={onMoveBack}
            disabled={isUpdating}
          >
            ← Voltar
          </Button>
        ) : <span />}
        {canGoForward && (
          <Button
            size="sm"
            variant="default"
            className="h-6 text-[10px] px-2"
            onClick={onMoveForward}
            disabled={isUpdating}
          >
            Avançar →
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function KanbanEntregas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useRealtime('entregas', () => {
    queryClient.invalidateQueries({ queryKey: ['kanban-entregas'] });
  });

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['kanban-entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id, numero_entrega, status, endereco_entrega, previsao_entrega,
          valor_frete, nf_remessa, created_at,
          cliente:clientes (razao_social, nome_fantasia),
          transportadora:transportadoras (nome_fantasia)
        `)
        .not('status', 'eq', 'finalizado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KanbanEntrega[];
    },
    enabled: !!user?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EntregaStatus }) => {
      const { error } = await supabase
        .from('entregas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-entregas'] });
      toast.success('Status atualizado!');
    },
    onError: (err) => {
      toast.error('Erro ao atualizar status', { description: err.message });
    },
  });

  const handleMoveForward = useCallback((entrega: KanbanEntrega) => {
    const nextStatuses = VALID_TRANSITIONS[entrega.status];
    if (nextStatuses.length > 0) {
      updateStatus.mutate({ id: entrega.id, status: nextStatuses[0] as EntregaStatus });
    }
  }, [updateStatus]);

  const handleMoveBack = useCallback((entrega: KanbanEntrega) => {
    const prevStatuses = Object.entries(VALID_TRANSITIONS)
      .filter(([, nexts]) => nexts.includes(entrega.status))
      .map(([status]) => status as EntregaStatus);
    if (prevStatuses.length > 0) {
      updateStatus.mutate({ id: entrega.id, status: prevStatuses[0] });
    }
  }, [updateStatus]);

  const getColumnEntregas = (columnId: EntregaStatus) => {
    return (entregas || []).filter(e => e.status === columnId);
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Package className="w-6 h-6 text-primary" />
              </div>
              Kanban de Entregas
            </h1>
            <p className="text-muted-foreground mt-1">
              Arraste entregas entre colunas para atualizar o status
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['kanban-entregas'] })} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          {COLUMNS.map(col => {
            const count = getColumnEntregas(col.id).length;
            if (count === 0) return null;
            const Icon = col.icon;
            return (
              <Badge key={col.id} variant="outline" className={cn("gap-1", col.color)}>
                <Icon className="w-3 h-3" />
                {col.title}: {count}
              </Badge>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {COLUMNS.map(column => {
              const items = getColumnEntregas(column.id);
              const Icon = column.icon;
              return (
                <div key={column.id} className={cn("w-[240px] flex-shrink-0 rounded-xl border", column.bgColor)}>
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", column.color)} />
                      <span className="text-xs font-semibold">{column.title}</span>
                    </div>
                    <Badge variant="secondary" className="h-5 text-[10px]">{items.length}</Badge>
                  </div>
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="p-2 space-y-2">
                      <AnimatePresence>
                        {items.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground/50">
                            Nenhuma entrega
                          </div>
                        ) : (
                          items.map(entrega => (
                            <EntregaCard
                              key={entrega.id}
                              entrega={entrega}
                              onMoveForward={() => handleMoveForward(entrega)}
                              onMoveBack={() => handleMoveBack(entrega)}
                              isUpdating={updateStatus.isPending}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

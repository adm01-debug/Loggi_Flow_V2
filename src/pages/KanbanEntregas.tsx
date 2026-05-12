import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, Send, Truck, CheckCircle2, AlertTriangle, Clock, 
  FileText, DollarSign, GripVertical, RefreshCw, Filter, Search,
  Camera, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DeliveryReceiptUpload } from '@/components/shipping/DeliveryReceiptUpload';

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
  comprovante_entrega_url: string | null;
  cliente: { razao_social: string; nome_fantasia: string | null } | null;
  transportadora: { nome_fantasia: string } | null;
}

const COLUMNS = [
  { id: 'pronto_despacho', title: 'Pronto Despacho', icon: Package, color: 'text-info', bgColor: 'bg-info/5' },
  { id: 'nf_emitida', title: 'NF Emitida', icon: FileText, color: 'text-primary', bgColor: 'bg-primary/5' },
  { id: 'despachado', title: 'Despachado', icon: Send, color: 'text-indigo-500', bgColor: 'bg-indigo-50/50' },
  { id: 'em_transito', title: 'Em Trânsito', icon: Truck, color: 'text-warning', bgColor: 'bg-warning/5' },
  { id: 'entregue', title: 'Entregue', icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/5' },
] as const;

function EntregaCard({ entrega, index }: { entrega: KanbanEntrega; index: number }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Draggable draggableId={entrega.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "p-3 rounded-xl border bg-card shadow-sm transition-all select-none group relative",
            snapshot.isDragging ? "shadow-xl ring-2 ring-primary border-primary scale-105 z-50" : "hover:border-primary/30"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              <span className="font-mono text-xs font-bold text-primary">{entrega.numero_entrega}</span>
            </div>
            {entrega.comprovante_entrega_url && (
              <Badge variant="outline" className="text-[9px] h-4 bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> OK
              </Badge>
            )}
          </div>

          <p className="text-xs font-medium truncate mb-1">
            {entrega.cliente?.nome_fantasia || entrega.cliente?.razao_social || 'Sem cliente'}
          </p>

          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
            {entrega.endereco_entrega}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2 border-t mt-auto">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-[9px] text-muted-foreground">
                {entrega.previsao_entrega ? format(new Date(entrega.previsao_entrega), 'dd/MM', { locale: ptBR }) : '--/--'}
              </span>
            </div>
            
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Entrega {entrega.numero_entrega}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold">Cliente</label>
                      <p className="font-medium">{entrega.cliente?.razao_social}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold">Status</label>
                      <Badge variant="secondary" className="block w-fit">{entrega.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold">Endereço</label>
                    <p className="text-sm">{entrega.endereco_entrega}</p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <label className="text-xs text-muted-foreground uppercase font-bold mb-2 block">Comprovante de Entrega</label>
                    <DeliveryReceiptUpload 
                      entregaId={entrega.id} 
                      currentUrl={entrega.comprovante_entrega_url} 
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanEntregas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  useRealtime({
    table: 'entregas',
    queryKey: ['kanban-entregas'],
  });

  const { data: entregas = [], isLoading } = useQuery({
    queryKey: ['kanban-entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id, numero_entrega, status, endereco_entrega, previsao_entrega,
          valor_frete, nf_remessa, created_at, comprovante_entrega_url,
          cliente:clientes (razao_social, nome_fantasia),
          transportadora:transportadoras (nome_fantasia)
        `)
        .not('status', 'eq', 'finalizado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KanbanEntrega[];
    },
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
    onError: (err: any) => {
      toast.error('Erro ao atualizar status', { description: err.message });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    updateStatus.mutate({ 
      id: draggableId, 
      status: destination.droppableId as EntregaStatus 
    });
  };

  const filteredEntregas = entregas.filter(e => 
    e.numero_entrega.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cliente?.razao_social.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Kanban de Entregas</h1>
              <p className="text-muted-foreground">Gestão visual do fluxo logístico de entregas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar entregas..." 
                className="pl-9 w-[240px] bg-muted/30 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['kanban-entregas'] })} className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
            <div className="flex gap-4 min-w-max h-[calc(100vh-240px)]">
              {COLUMNS.map(column => {
                const columnItems = filteredEntregas.filter(e => e.status === column.id);
                const Icon = column.icon;
                
                return (
                  <div key={column.id} className={cn("w-[280px] flex flex-col rounded-2xl border bg-muted/30")}>
                    <div className="p-4 flex items-center justify-between border-b bg-background/50 backdrop-blur-sm rounded-t-2xl">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", column.bgColor)}>
                          <Icon className={cn("w-4 h-4", column.color)} />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{column.title}</span>
                      </div>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-black">{columnItems.length}</Badge>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <ScrollArea className="flex-1">
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "p-3 space-y-3 min-h-[150px] transition-colors",
                              snapshot.isDraggingOver && "bg-primary/5"
                            )}
                          >
                            <AnimatePresence>
                              {columnItems.map((entrega, index) => (
                                <EntregaCard 
                                  key={entrega.id} 
                                  entrega={entrega} 
                                  index={index} 
                                />
                              ))}
                            </AnimatePresence>
                            {provided.placeholder}
                            {columnItems.length === 0 && !snapshot.isDraggingOver && (
                              <div className="flex flex-col items-center justify-center py-10 opacity-20 select-none">
                                <Icon className="w-10 h-10 mb-2" />
                                <span className="text-[10px] uppercase font-bold tracking-tighter text-center">Nenhuma entrega</span>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      </div>
    </MainLayout>
  );
}

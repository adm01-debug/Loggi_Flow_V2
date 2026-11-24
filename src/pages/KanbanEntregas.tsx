/* eslint-disable max-lines */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TRANSICOES_ENTREGA,
  mensagemRecusaTransicao,
} from "@/lib/statusTransitions";
import { assertAtualizou } from "@/lib/conflitoVersao";
import { EmptyState } from "@/components/common/EmptyState";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Send,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  GripVertical,
  RefreshCw,
  Search,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";
import { useRuleTriggers } from "@/hooks/logistics/useRuleTriggers";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/data/useRealtime";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeliveryReceiptUpload } from "@/components/shipping/DeliveryReceiptUpload";

type EntregaStatus =
  | "aguardando_producao"
  | "pronto_despacho"
  | "cotacao_frete"
  | "nf_emitida"
  | "despachado"
  | "em_transito"
  | "saiu_entrega"
  | "entregue"
  | "ocorrencia"
  | "finalizado";

interface KanbanEntrega {
  id: string;
  numero_entrega: string;
  status: EntregaStatus;
  endereco_entrega: string;
  previsao_entrega: string | null;
  valor_frete: number | null;
  nf_remessa: string | null;
  version: number;
  created_at: string;
  comprovante_entrega_url: string | null;
  cliente: { razao_social: string; nome_fantasia: string | null } | null;
  transportadora: { nome_fantasia: string } | null;
}

const COLUMNS = [
  {
    id: "pronto_despacho",
    title: "Pronto Despacho",
    icon: Package,
    color: "text-info",
    bgColor: "bg-info/5",
  },
  {
    id: "nf_emitida",
    title: "NF Emitida",
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
  {
    id: "despachado",
    title: "Despachado",
    icon: Send,
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
  {
    id: "em_transito",
    title: "Em Trânsito",
    icon: Truck,
    color: "text-warning",
    bgColor: "bg-warning/5",
  },
  {
    id: "entregue",
    title: "Entregue",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/5",
  },
] as const;

function EntregaCard({
  entrega,
  index,
}: {
  entrega: KanbanEntrega;
  index: number;
}) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Draggable draggableId={entrega.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "p-3 rounded-xl border bg-card shadow-sm transition-all select-none group relative cursor-pointer",
            snapshot.isDragging
              ? "shadow-xl ring-2 ring-primary border-primary scale-105 z-50"
              : "hover:border-primary/30",
          )}
          onClick={() => navigate(`/rastreamento/${entrega.id}`)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              <span className="font-mono text-xs font-bold text-primary">
                {entrega.numero_entrega}
              </span>
            </div>
            {entrega.comprovante_entrega_url && (
              <Badge
                variant="outline"
                className="text-[9px] h-4 bg-success/10 text-success border-success/20"
              >
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> OK
              </Badge>
            )}
          </div>

          <p className="text-xs font-medium truncate mb-1">
            {entrega.cliente?.nome_fantasia ||
              entrega.cliente?.razao_social ||
              "Sem cliente"}
          </p>

          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
            {entrega.endereco_entrega}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2 border-t mt-auto">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-[9px] text-muted-foreground">
                {entrega.previsao_entrega &&
                isValid(new Date(entrega.previsao_entrega))
                  ? format(new Date(entrega.previsao_entrega), "dd/MM", {
                      locale: ptBR,
                    })
                  : "--/--"}
              </span>
            </div>

            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                >
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
                      <label className="text-xs text-muted-foreground uppercase font-bold">
                        Cliente
                      </label>
                      <p className="font-medium">
                        {entrega.cliente?.razao_social}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold">
                        Status
                      </label>
                      <Badge variant="secondary" className="block w-fit">
                        {entrega.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold">
                      Endereço
                    </label>
                    <p className="text-sm">{entrega.endereco_entrega}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-xs text-muted-foreground uppercase font-bold mb-2 block">
                      Comprovante de Entrega
                    </label>
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
  const [searchTerm, setSearchTerm] = useState("");
  const { playSuccess, playError } = useAudioFeedback();
  const { onStatusChange } = useRuleTriggers();

  // Referencias estaveis (contrato em src/hooks/data/useRealtime.tsx).
  const onEntregaKanban = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["kanban-entregas"] });
  }, [queryClient]);

  useRealtime({
    table: "entregas",
    onUpdate: onEntregaKanban,
    onInsert: onEntregaKanban,
    onDelete: onEntregaKanban,
  });

  const {
    data: entregas = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["kanban-entregas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(
          `
          id, numero_entrega, status, endereco_entrega, previsao_entrega,
          valor_frete, nf_remessa, version, created_at, comprovante_entrega_url,
          cliente:clientes (razao_social, nome_fantasia),
          transportadora:transportadoras (nome_fantasia)
        `,
        )
        .is("deleted_at", null)
        .not("status", "eq", "finalizado")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as KanbanEntrega[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      statusAtual,
      version,
    }: {
      id: string;
      status: EntregaStatus;
      statusAtual: EntregaStatus;
      version: number;
    }) => {
      if (!TRANSICOES_ENTREGA[statusAtual].includes(status)) {
        throw new Error(
          `${statusAtual} -> ${status}: transicao invalida. Destinos validos a partir de ${statusAtual}: ${
            TRANSICOES_ENTREGA[statusAtual].join(", ") ||
            "nenhum (estado final)"
          }.`,
        );
      }

      const { error, count } = await supabase
        .from("entregas")
        .update(
          {
            status,
            updated_at: new Date().toISOString(),
            ...(status === "entregue"
              ? { data_entrega_efetiva: new Date().toISOString() }
              : {}),
            ...(status === "despachado"
              ? { data_despacho: new Date().toISOString() }
              : {}),
          },
          { count: "exact" },
        )
        .eq("id", id)
        .eq("version", version);
      if (error) throw error;
      assertAtualizou(count);

      await onStatusChange("entrega", id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-entregas"] });
      toast.success("Status do fluxo logístico atualizado com sucesso!");
      playSuccess();
    },
    onError: (err: Error) => {
      toast.error("Erro crítico na transição de status", {
        description: mensagemRecusaTransicao(err, "entrega") ?? err.message,
      });
      playError();
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const item = entregas.find((e) => e.id === draggableId);
    if (!item) return;

    updateStatus.mutate({
      id: draggableId,
      status: destination.droppableId as EntregaStatus,
      statusAtual: item.status as EntregaStatus,
      version: item.version,
    });
  };

  const filteredEntregas = entregas.filter(
    (e) =>
      e.numero_entrega.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.cliente?.nome_fantasia || e.cliente?.razao_social || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar entregas"
            description={
              error?.message ||
              "Não foi possível carregar as entregas do kanban. Tente novamente."
            }
            action={{
              label: "Tentar novamente",
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
              <Package className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Kanban de Entregas 10/10
              </h1>
              <p className="text-muted-foreground font-medium">
                Gestão visual e tátil do fluxo logístico em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Filtrar por NF, Código ou Cliente..."
                className="pl-9 w-[280px] bg-muted/30 border-none shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["kanban-entregas"] })
              }
              className="gap-2 border-primary/20 hover:bg-primary/5"
            >
              <RefreshCw
                className={cn("w-4 h-4", isLoading && "animate-spin")}
              />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <div className="flex gap-6 min-w-max h-[calc(100vh-220px)]">
              {COLUMNS.map((column, colIdx) => {
                const columnItems = filteredEntregas.filter(
                  (e) => e.status === column.id,
                );
                const Icon = column.icon;

                return (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: colIdx * 0.1 }}
                    className={cn(
                      "w-[320px] flex flex-col rounded-[2rem] border bg-muted/20 shadow-sm overflow-hidden",
                    )}
                  >
                    <div className="p-5 flex items-center justify-between bg-background/40 backdrop-blur-md border-b">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-xl shadow-sm",
                            column.bgColor,
                          )}
                        >
                          <Icon className={cn("w-5 h-5", column.color)} />
                        </div>
                        <span className="text-sm font-black tracking-tight uppercase text-foreground/80">
                          {column.title}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="h-6 px-2 text-xs font-black bg-background border shadow-inner"
                      >
                        {columnItems.length}
                      </Badge>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <ScrollArea className="flex-1">
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "p-4 space-y-4 min-h-[200px] transition-colors duration-300",
                              snapshot.isDraggingOver && "bg-primary/5",
                            )}
                          >
                            <AnimatePresence mode="popLayout">
                              {columnItems.map((entrega, index) => (
                                <motion.div
                                  key={entrega.id}
                                  layout
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                  }}
                                >
                                  <EntregaCard
                                    entrega={entrega}
                                    index={index}
                                  />
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            {provided.placeholder}
                            {columnItems.length === 0 &&
                              !snapshot.isDraggingOver && (
                                <div className="flex flex-col items-center justify-center py-20 opacity-10 select-none grayscale">
                                  <Icon className="w-16 h-16 mb-4" />
                                  <span className="text-xs uppercase font-black tracking-widest text-center">
                                    Vazio
                                  </span>
                                </div>
                              )}
                          </div>
                        </ScrollArea>
                      )}
                    </Droppable>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      </div>
    </MainLayout>
  );
}

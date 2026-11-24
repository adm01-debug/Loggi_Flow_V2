/* eslint-disable max-lines */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  Clock,
  RefreshCw,
  ArrowRight,
  LucideIcon,
  AlertTriangle,
  FileText,
  LayoutGrid,
  Activity,
  History,
  MapPin,
  Tag,
} from "lucide-react";
import { useRealtime } from "@/hooks/data/useRealtime";
import { FilterBar } from "@/components/common/FilterBar";
import { EmptyState } from "@/components/common/EmptyState";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type EntregaStatus = Database["public"]["Enums"]["entrega_status"];
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ExpeditionDetailsDialog } from "@/components/shipping/ExpeditionDetailsDialog";
import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRuleTriggers } from "@/hooks/logistics/useRuleTriggers";
import {
  TRANSICOES_ENTREGA,
  mensagemRecusaTransicao,
} from "@/lib/statusTransitions";
import { assertAtualizou } from "@/lib/conflitoVersao";

interface Despacho {
  id: string;
  numero: string;
  numero_entrega: string;
  cliente: string;
  destino: string;
  status: string;
  transportadora?: string;
  nf_remessa?: string | null;
  box_alocado?: string | null;
  tags?: string[] | null;
  version: number;
  created_at: string;
}

const filterConfig: FilterConfig<Despacho> = {
  search: {
    fields: ["numero", "numero_entrega", "cliente", "destino"],
    placeholder: "Buscar protocolo...",
  },
  status: {
    field: "status",
    options: [
      { value: "pronto_despacho", label: "BOX" },
      { value: "cotacao_frete", label: "Cotação" },
      { value: "nf_emitida", label: "NF" },
      { value: "despachado", label: "Despacho" },
    ],
  },
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  pronto_despacho: {
    label: "BOX",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Package,
  },
  cotacao_frete: {
    label: "Cotação",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: Clock,
  },
  nf_emitida: {
    label: "NF",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: FileText,
  },
  despachado: {
    label: "Despacho",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Truck,
  },
};

/**
 * Proximo destino de avanco automatico. Retorna so quando existe exatamente um
 * destino valido: em bifurcacao (ex.: saiu_entrega -> entregue|ocorrencia) quem
 * decide e o operador, nao o botao.
 */
function proximoDestinoUnico(status: string): EntregaStatus | undefined {
  const destinos = TRANSICOES_ENTREGA[status as EntregaStatus];
  if (!destinos || destinos.length !== 1) return undefined;
  return destinos[0];
}

export default function Despachos() {
  const { user } = useAuth();
  const { onStatusChange } = useRuleTriggers();
  const [confirmItem, setConfirmItem] = useState<Despacho | null>(null);
  const [selectedItem, setSelectedItem] = useState<Despacho | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { playSuccess, playWhoosh, playNotification } = useAudioFeedback();

  const {
    data: despachos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["despachos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(
          "id, numero_entrega, status, nf_remessa, box_alocado, tags, version, endereco_entrega, created_at, cliente:clientes(razao_social, nome_fantasia), transportadora:transportadoras(nome_fantasia)",
        )
        .in("status", [
          "pronto_despacho",
          "cotacao_frete",
          "nf_emitida",
          "despachado",
        ])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        numero:
          (d.numero_entrega as string)?.slice(-8) ||
          (d.id as string).slice(0, 8),
        numero_entrega: (d.numero_entrega as string) || "",
        cliente:
          (d.cliente as Record<string, string>)?.nome_fantasia ||
          (d.cliente as Record<string, string>)?.razao_social ||
          "Cliente",
        destino: (d.endereco_entrega as string) || "Endereço",
        status: (d.status as string) || "pronto_despacho",
        transportadora: (d.transportadora as Record<string, string>)
          ?.nome_fantasia,
        nf_remessa: d.nf_remessa as string | undefined,
        box_alocado: d.box_alocado as string | undefined,
        tags: d.tags as string[] | undefined,
        version: d.version as number,
        created_at: d.created_at as string,
      })) as Despacho[];
    },
  });

  // Referencias estaveis: som dentro de callback instavel pode tocar duas vezes se o
  // canal reabrir no meio do evento (contrato em src/hooks/data/useRealtime.tsx).
  const onEntregaNova = useCallback(() => {
    playNotification();
    refetch();
  }, [playNotification, refetch]);
  const onEntregaAtualizada = useCallback(() => {
    refetch();
  }, [refetch]);

  useRealtime({
    table: "entregas",
    onInsert: onEntregaNova,
    onUpdate: onEntregaAtualizada,
  });

  const {
    filteredData,
    filters,
    setSearch,
    setStatus,
    clearFilters,
    hasActiveFilters,
    totalFiltered,
    totalOriginal,
  } = useFilters(despachos, filterConfig);

  const columns = [
    "pronto_despacho",
    "cotacao_frete",
    "nf_emitida",
    "despachado",
  ];
  const getColumnItems = (status: string) =>
    filteredData.filter((d) => d.status === status);
  const stats = {
    total: despachos.length,
    prontos: despachos.filter((d) => d.status === "pronto_despacho").length,
    cotacao: despachos.filter((d) => d.status === "cotacao_frete").length,
    nfEmitida: despachos.filter((d) => d.status === "nf_emitida").length,
    despachados: despachos.filter((d) => d.status === "despachado").length,
  };

  const handleOpenDetails = (item: Despacho) => {
    playWhoosh();
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const moveToNextMutation = useMutation({
    mutationFn: async (item: Despacho) => {
      const nextStatus = proximoDestinoUnico(item.status);
      if (!nextStatus) return;

      const { error, count } = await supabase
        .from("entregas")
        .update({ status: nextStatus as EntregaStatus }, { count: "exact" })
        .eq("id", item.id)
        .eq("version", item.version);
      if (error) throw error;
      assertAtualizou(count);

      await onStatusChange("entrega", item.id, { status: nextStatus });

      const { error: histError } = await supabase
        .from("kanban_history")
        .insert({
          delivery_id: item.id,
          from_status: item.status,
          to_status: nextStatus,
          action_by: user?.id,
          notes: `Transição automática no Kanban: ${item.status} -> ${nextStatus}`,
        });
      if (histError) console.warn("kanban_history insert:", histError.message);

      return nextStatus;
    },
    onSuccess: (nextStatus) => {
      if (!nextStatus) return;
      playSuccess();
      toast.success(
        `Movido para ${statusConfig[nextStatus]?.label || nextStatus}`,
      );
      refetch();
    },
    onError: (error: Error) =>
      toast.error(mensagemRecusaTransicao(error, "entrega") ?? error.message),
  });

  const moveToNext = (item: Despacho) => {
    const nextStatus = proximoDestinoUnico(item.status);
    if (!nextStatus) return;

    if (nextStatus === "despachado" && !item.nf_remessa) {
      toast.error(
        "NF de Simples Remessa obrigatória antes do despacho. Emita a NF primeiro.",
      );
      return;
    }

    if (nextStatus === "despachado") {
      setConfirmItem(item);
      return;
    }

    moveToNextMutation.mutate(item);
  };

  const confirmDispatchMutation = useMutation({
    mutationFn: async (item: Despacho) => {
      const { error, count } = await supabase
        .from("entregas")
        .update(
          {
            status: "despachado" as EntregaStatus,
            data_despacho: new Date().toISOString(),
          },
          { count: "exact" },
        )
        .eq("id", item.id)
        .eq("version", item.version);
      if (error) throw error;
      assertAtualizou(count);

      await onStatusChange("entrega", item.id, { status: "despachado" });

      const { error: histError } = await supabase
        .from("kanban_history")
        .insert({
          delivery_id: item.id,
          from_status: item.status,
          to_status: "despachado",
          action_by: user?.id,
          notes: "Despacho final autorizado",
        });
      if (histError) console.warn("kanban_history insert:", histError.message);
    },
    onSuccess: () => {
      playSuccess();
      toast.success("Entrega despachada com sucesso!");
      setConfirmItem(null);
      refetch();
    },
    onError: (error: Error) =>
      toast.error(mensagemRecusaTransicao(error, "entrega") ?? error.message),
  });

  const confirmDispatch = () => {
    if (!confirmItem) return;
    confirmDispatchMutation.mutate(confirmItem);
  };

  if (isError) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar despachos"
            description={
              error?.message ||
              "Nao foi possivel carregar a fila de despacho. Tente novamente."
            }
            action={{
              label: "Tentar novamente",
              onClick: () => refetch(),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Expedição</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Live_Nexus
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    BOX → NF → DESPACHO
                  </span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => refetch()}
              className="h-14 px-8 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[11px] gap-3 hover:bg-white/5 transition-all group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700 text-primary" />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* Tactical Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
          {columns.map((col) => {
            const config = statusConfig[col];
            const statsKeyMap: Record<string, keyof typeof stats> = {
              pronto_despacho: "prontos",
              cotacao_frete: "cotacao",
              nf_emitida: "nfEmitida",
              despachado: "despachados",
            };
            const count = stats[statsKeyMap[col] ?? "despachados"];
            return (
              <div
                key={col}
                className={cn(
                  "group relative overflow-hidden p-6 rounded-[2rem] border-2 backdrop-blur-3xl transition-all hover:scale-[1.02]",
                  config.color,
                )}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:opacity-10 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-xl">
                      <config.icon className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-black tracking-tighter tabular-nums italic">
                      {count}
                    </span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-2">
          <FilterBar
            search={filters.search}
            onSearchChange={setSearch}
            searchPlaceholder="Filtro de protocolo..."
            status={filters.status}
            onStatusChange={setStatus}
            statusOptions={filterConfig.status?.options}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            totalFiltered={totalFiltered}
            totalOriginal={totalOriginal}
          />
        </div>

        <div className="flex items-center gap-3 px-6 py-4 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 mx-2 backdrop-blur-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
            Protocolo de Segurança:{" "}
            <span className="text-white underline decoration-amber-500/30 underline-offset-4">
              NF de Remessa obrigatória
            </span>{" "}
            para transição final de despacho.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">
              Carregando Malha Logística...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
            {columns.map((col) => {
              const config = statusConfig[col];
              const items = getColumnItems(col);
              return (
                <div key={col} className="flex flex-col gap-5 min-h-[600px]">
                  <div
                    className={cn(
                      "p-5 rounded-[2rem] flex items-center justify-between shadow-2xl border-2 backdrop-blur-xl",
                      config.color,
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-black/20">
                        <config.icon className="w-5 h-5" />
                      </div>
                      <span className="font-black uppercase tracking-[0.3em] text-[11px] italic">
                        {config.label}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-black/40 text-white border-white/10 font-black px-3 py-1 rounded-full text-xs"
                    >
                      {items.length}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-4">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -5 }}
                          className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-card/40 to-card/20 border border-white/5 backdrop-blur-xl shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer p-6"
                          onClick={() => handleOpenDetails(item)}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                              <Activity className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/5 text-[10px] font-black text-primary tracking-widest uppercase">
                              #{item.numero_entrega.slice(-6)}
                            </span>
                            {item.box_alocado && (
                              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1">
                                <LayoutGrid className="w-3 h-3" /> BOX_
                                {item.box_alocado}
                              </span>
                            )}
                          </div>

                          <h3 className="font-black text-lg tracking-tighter uppercase italic text-white group-hover:text-primary transition-colors truncate mb-1">
                            {item.cliente}
                          </h3>

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {item.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/20 text-[8px] font-black text-primary uppercase tracking-tighter border border-primary/30"
                                >
                                  <Tag className="w-2 h-2" /> {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-[11px] font-medium text-white/40 truncate flex items-center gap-2 mb-4">
                            <MapPin className="w-3 h-3 text-primary/50" />{" "}
                            {item.destino}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex gap-2">
                              {item.nf_remessa ? (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                  NF_LINKED
                                </Badge>
                              ) : (
                                <Badge className="bg-white/5 text-white/30 border-white/10 text-[8px] font-black uppercase tracking-widest">
                                  NF_PENDING
                                </Badge>
                              )}
                            </div>

                            {col !== "despachado" &&
                              proximoDestinoUnico(col) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={moveToNextMutation.isPending}
                                  className="h-9 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest gap-2 group/btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveToNext(item);
                                  }}
                                >
                                  PROSSEGUIR
                                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                              )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {items.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/5">
                        <History className="w-10 h-10 text-white/10 mb-3" />
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                          Fila Limpa
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ExpeditionDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          delivery={selectedItem}
          statusConfig={
            statusConfig as unknown as Record<
              string,
              { color: string; label: string; icon: LucideIcon }
            >
          }
          onStatusUpdate={() => {
            refetch();
          }}
        />

        <ConfirmDialog
          open={!!confirmItem}
          onOpenChange={(open) => !open && setConfirmItem(null)}
          title="AUTORIZAR DESPACHO FINAL"
          description={`Confirmar saída do material ${confirmItem?.numero_entrega}? Esta ação é irreversível e registrará o timestamp de saída na malha logistica.`}
          onConfirm={confirmDispatch}
          isLoading={confirmDispatchMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}

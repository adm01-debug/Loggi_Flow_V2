import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, Plus, Loader2, RefreshCw, ArrowRight, LucideIcon, AlertTriangle, FileText, LayoutGrid, Activity, History } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ExpeditionDetailsDialog } from "@/components/shipping/ExpeditionDetailsDialog";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";

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
  version: number;
  created_at: string;
}

const filterConfig: FilterConfig<Despacho> = {
  search: {
    fields: ["numero", "numero_entrega", "cliente", "destino"],
    placeholder: "Buscar protocolo..."
  },
  status: {
    field: "status",
    options: [
      { value: "pronto_despacho", label: "BOX" },
      { value: "cotacao_frete", label: "Cotação" },
      { value: "nf_emitida", label: "NF" },
      { value: "despachado", label: "Despacho" },
    ]
  }
};

const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  pronto_despacho: { label: "BOX", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Package },
  cotacao_frete: { label: "Cotação", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  nf_emitida: { label: "NF", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: FileText },
  despachado: { label: "Despacho", color: "bg-primary/10 text-primary border-primary/20", icon: Truck },
};

const validTransitions: Record<string, string> = {
  pronto_despacho: "cotacao_frete",
  cotacao_frete: "nf_emitida",
  nf_emitida: "despachado",
};

export default function Despachos() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmItem, setConfirmItem] = useState<Despacho | null>(null);

  const { data: despachos = [], isLoading, refetch } = useQuery({
    queryKey: ["despachos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select("id, numero_entrega, status, nf_remessa, box_alocado, version, endereco_entrega, created_at, cliente:clientes(razao_social, nome_fantasia), transportadora:transportadoras(nome_fantasia)")
        .in("status", ["pronto_despacho", "cotacao_frete", "nf_emitida", "despachado"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        numero: (d.numero_entrega as string)?.slice(-8) || (d.id as string).slice(0, 8),
        numero_entrega: (d.numero_entrega as string) || "",
        cliente: (d.cliente as Record<string, string>)?.nome_fantasia || (d.cliente as Record<string, string>)?.razao_social || "Cliente",
        destino: (d.endereco_entrega as string) || "Endereço",
        status: (d.status as string) || "pronto_despacho",
        transportadora: (d.transportadora as Record<string, string>)?.nome_fantasia,
        nf_remessa: d.nf_remessa as string | undefined,
        box_alocado: d.box_alocado as string | undefined,
        version: d.version as number,
        created_at: d.created_at as string,
      })) as Despacho[];
    },
  });

  useRealtime({ table: "entregas", onInsert: () => refetch(), onUpdate: () => refetch() });

  const { filteredData, filters, setSearch, setStatus, clearFilters, hasActiveFilters, totalFiltered, totalOriginal } = useFilters(despachos, filterConfig);

  const columns = ["pronto_despacho", "cotacao_frete", "nf_emitida", "despachado"];
  const getColumnItems = (status: string) => filteredData.filter(d => d.status === status);
  const stats = {
    total: despachos.length,
    prontos: getColumnItems("pronto_despacho").length,
    cotacao: getColumnItems("cotacao_frete").length,
    nfEmitida: getColumnItems("nf_emitida").length,
    despachados: getColumnItems("despachado").length,
  };

  const moveToNext = async (item: Despacho) => {
    const nextStatus = validTransitions[item.status];
    if (!nextStatus) return;

    // CRITICAL RULE: NF must be present before dispatch
    if (nextStatus === "despachado" && !item.nf_remessa) {
      toast.error("NF de Simples Remessa obrigatória antes do despacho. Emita a NF primeiro.");
      return;
    }

    // Confirm dispatch action
    if (nextStatus === "despachado") {
      setConfirmItem(item);
      return;
    }

    await supabase.from("entregas").update({ status: nextStatus as any }).eq("id", item.id).eq("version", item.version);
    toast.success(`Movido para ${statusConfig[nextStatus]?.label || nextStatus}`);
    refetch();
  };

  const confirmDispatch = async () => {
    if (!confirmItem) return;
    await supabase.from("entregas").update({ status: "despachado" as any, data_despacho: new Date().toISOString() }).eq("id", confirmItem.id).eq("version", confirmItem.version);
    toast.success("Entrega despachada com sucesso!");
    setConfirmItem(null);
    refetch();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground flex items-center gap-3 sm:gap-4 tracking-tighter">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 group cursor-pointer transition-transform hover:rotate-6">
                <Package className="w-6 h-6 sm:w-9 sm:h-9 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="truncate drop-shadow-sm">Despachos</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.2em]">Expedição Kanban Nexus</span>
                </div>
              </div>
            </h1>
          </div>
          <Button variant="outline" size="lg" onClick={() => refetch()} className="h-12 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[11px] gap-2 hover:bg-primary/5 transition-all"><RefreshCw className="w-4 h-4" />Atualizar</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-200">
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums">{stats.prontos}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Pronto Despacho</p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-warning/10 text-warning group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-warning">{stats.cotacao}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Em Cotação</p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-success/10 text-success group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-success">{stats.nfEmitida}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">NF Emitida</p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums">{stats.despachados}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Despachados</p>
          </div>
        </div>

        <FilterBar
          search={filters.search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar despacho..."
          status={filters.status}
          onStatusChange={setStatus}
          statusOptions={filterConfig.status?.options}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          totalFiltered={totalFiltered}
          totalOriginal={totalOriginal}
        />

        {/* NF Warning */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <span className="text-warning">Regra: NF de Simples Remessa deve ser emitida <strong>antes</strong> do despacho</span>
        </div>

        {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((col) => {
              const config = statusConfig[col] || { label: col, color: "bg-muted text-muted-foreground", icon: Package };
              const Icon = config.icon;
              const items = getColumnItems(col);
              return (
                <div key={col} className="space-y-3">
                  <div className={cn("p-4 rounded-2xl flex items-center justify-between shadow-lg", config.color)}>
                    <div className="flex items-center gap-3"><Icon className="w-5 h-5" /><span className="font-black uppercase tracking-widest text-[11px] italic">{config.label}</span></div>
                    <Badge variant="secondary" className="bg-black/20 text-foreground border-none font-black">{items.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[150px]">
                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">Nenhum item</p>
                    )}
                    {items.map((item) => (
                      <motion.div 
                        key={item.id} 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -2 }}
                        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary p-5"
                        onClick={() => navigate(`/rastreamento/${item.id}`)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[10px] font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">
                              #{item.numero_entrega.slice(-6)}
                            </span>
                            {validTransitions[col] && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveToNext(item);
                                }}
                                title={`Mover para ${statusConfig[validTransitions[col]]?.label}`}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="font-black text-base tracking-tighter uppercase italic truncate text-foreground group-hover/card:text-primary transition-colors">{item.cliente}</p>
                          <p className="text-[11px] text-muted-foreground truncate leading-relaxed mt-0.5">{item.destino}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {item.transportadora && (
                              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter border-primary/20 bg-primary/5">
                                <Truck className="w-2.5 h-2.5 mr-1" /> {item.transportadora}
                              </Badge>
                            )}
                            {item.box_alocado && (
                              <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-tighter">
                                📦 BOX {item.box_alocado}
                              </Badge>
                            )}
                            {item.nf_remessa ? (
                              <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-tighter bg-success/20 text-success border-success/20">
                                NF OK
                              </Badge>
                            ) : col !== "pronto_despacho" && (
                              <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-tighter bg-destructive/10 text-destructive border-destructive/20 animate-pulse">
                                SEM NF
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={!!confirmItem}
          onOpenChange={(open) => !open && setConfirmItem(null)}
          title="Confirmar Despacho"
          description={`Deseja despachar a entrega ${confirmItem?.numero_entrega}? Esta ação registrará a data de despacho.`}
          onConfirm={confirmDispatch}
        />
      </div>
    </MainLayout>
  );
}

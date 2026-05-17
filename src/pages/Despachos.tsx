import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, CheckCircle2, Plus, Loader2, RefreshCw, ArrowRight, LucideIcon, AlertTriangle, FileText } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

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
    placeholder: "Buscar despacho..."
  },
  status: {
    field: "status",
    options: [
      { value: "pronto_despacho", label: "Pronto Despacho" },
      { value: "cotacao_frete", label: "Cotação Frete" },
      { value: "nf_emitida", label: "NF Emitida" },
      { value: "despachado", label: "Despachado" },
    ]
  }
};

const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  pronto_despacho: { label: "Pronto Despacho", color: "bg-primary/15 text-primary", icon: Package },
  cotacao_frete: { label: "Cotação Frete", color: "bg-warning/15 text-warning", icon: Clock },
  nf_emitida: { label: "NF Emitida", color: "bg-success/15 text-success", icon: FileText },
  despachado: { label: "Despachado", color: "bg-primary/10 text-primary", icon: Truck },
};

// Valid flow: pronto_despacho → cotacao_frete → nf_emitida → despachado
const validTransitions: Record<string, string> = {
  pronto_despacho: "cotacao_frete",
  cotacao_frete: "nf_emitida",
  nf_emitida: "despachado",
};

export default function Despachos() {
  const qc = useQueryClient();
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
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              Despachos
            </h1>
            <p className="text-muted-foreground mt-1">Kanban de expedição — fluxo BOX → NF → Despacho</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card text-center p-3"><Package className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-xl font-bold">{stats.prontos}</p><p className="text-[10px] text-muted-foreground">Prontos</p></div>
          <div className="stat-card text-center p-3"><Clock className="w-5 h-5 text-warning mx-auto mb-1" /><p className="text-xl font-bold">{stats.cotacao}</p><p className="text-[10px] text-muted-foreground">Cotação</p></div>
          <div className="stat-card text-center p-3"><FileText className="w-5 h-5 text-success mx-auto mb-1" /><p className="text-xl font-bold">{stats.nfEmitida}</p><p className="text-[10px] text-muted-foreground">NF Emitida</p></div>
          <div className="stat-card text-center p-3"><Truck className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-xl font-bold">{stats.despachados}</p><p className="text-[10px] text-muted-foreground">Despachados</p></div>
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
                  <div className={cn("p-3 rounded-lg flex items-center justify-between", config.color)}>
                    <div className="flex items-center gap-2"><Icon className="w-4 h-4" /><span className="font-semibold text-sm">{config.label}</span></div>
                    <Badge variant="secondary">{items.length}</Badge>
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
                        className="card-interactive p-3 border-2 hover:border-primary/40 group/card relative overflow-hidden"
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
                                onClick={() => moveToNext(item)}
                                title={`Mover para ${statusConfig[validTransitions[col]]?.label}`}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="font-bold text-sm truncate text-foreground group-hover/card:text-primary transition-colors">{item.cliente}</p>
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

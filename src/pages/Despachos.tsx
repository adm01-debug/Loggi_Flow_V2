import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, CheckCircle2, Plus, Loader2, RefreshCw, ArrowRight, LucideIcon } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Despacho { id: string; numero: string; cliente: string; destino: string; status: string; transportadora?: string; created_at: string; }

const filterConfig: FilterConfig<Despacho> = {
  search: {
    fields: ["numero", "cliente", "destino"],
    placeholder: "Buscar despacho..."
  },
  status: {
    field: "status",
    options: [
      { value: "aguardando", label: "Aguardando" },
      { value: "em_separacao", label: "Em Separação" },
      { value: "pronto", label: "Pronto" },
      { value: "despachado", label: "Despachado" }
    ]
  }
};

const statusConfig: Record<string, { color: string; icon: LucideIcon }> = {
  aguardando: { color: "bg-muted text-muted-foreground", icon: Clock },
  em_separacao: { color: "bg-warning/15 text-warning", icon: Package },
  pronto: { color: "bg-success/15 text-success", icon: CheckCircle2 },
  despachado: { color: "bg-primary/15 text-primary", icon: Truck },
};

export default function Despachos() {
  const qc = useQueryClient();
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const { data: despachos = [], isLoading, refetch } = useQuery({
    queryKey: ["despachos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entregas").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      interface EntregaRow {
        id: string;
        numero_nf?: string;
        cliente_nome?: string;
        endereco_destino?: string;
        status?: string;
        transportadora_nome?: string;
        created_at: string;
      }
      return (data || []).map((d: EntregaRow) => ({ id: d.id, numero: d.numero_nf || d.id.slice(0, 8), cliente: d.cliente_nome || "Cliente", destino: d.endereco_destino || "Endereço", status: d.status || "aguardando", transportadora: d.transportadora_nome, created_at: d.created_at }));
    },
  });

  useRealtime({ table: "entregas", onInsert: () => refetch(), onUpdate: () => refetch() });

  const { filteredData, filters, setSearch, setStatus, clearFilters, hasActiveFilters, totalFiltered, totalOriginal } = useFilters(despachos, filterConfig);

  const columns = ["aguardando", "em_separacao", "pronto", "despachado"];
  const getColumnItems = (status: string) => filteredData.filter(d => d.status === status);
  const stats = { total: despachos.length, aguardando: getColumnItems("aguardando").length, pronto: getColumnItems("pronto").length, despachado: getColumnItems("despachado").length };

  const moveToNext = async (item: Despacho) => {
    const idx = columns.indexOf(item.status);
    if (idx >= 0 && idx < columns.length - 1) {
      const nextStatus = columns[idx + 1] as "aguardando_producao" | "pronto_despacho" | "cotacao_frete" | "nf_emitida" | "despachado" | "em_transito" | "saiu_entrega" | "entregue" | "ocorrencia" | "finalizado";
      await supabase.from("entregas").update({ status: nextStatus }).eq("id", item.id);
      refetch();
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/10"><Package className="w-6 h-6 text-teal-500" /></div>Despachos</h1><p className="text-muted-foreground mt-1">Kanban de expedição</p></div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button><Button><Plus className="w-4 h-4 mr-2" />Novo</Button></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><Package className="w-5 h-5 text-teal-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-gray-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.aguardando}</p><p className="text-xs text-muted-foreground">Aguardando</p></div>
          <div className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.pronto}</p><p className="text-xs text-muted-foreground">Prontos</p></div>
          <div className="stat-card text-center"><Truck className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.despachado}</p><p className="text-xs text-muted-foreground">Despachados</p></div>
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
        {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-4 gap-4">
            {columns.map((col) => {
              const config = statusConfig[col];
              const Icon = config.icon;
              const items = getColumnItems(col);
              return (
                <div key={col} className="space-y-3">
                  <div className={cn("p-3 rounded-lg flex items-center justify-between", config.color)}><div className="flex items-center gap-2"><Icon className="w-4 h-4" /><span className="font-semibold capitalize">{col.replace("_", " ")}</span></div><Badge variant="secondary">{items.length}</Badge></div>
                  <div className="space-y-2 min-h-[200px]">{items.map((item) => (
                    <div key={item.id} className="card-interactive p-3">
                      <div className="flex items-center justify-between mb-2"><span className="font-mono text-sm">#{item.numero}</span>{col !== "despachado" && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveToNext(item)}><ArrowRight className="w-4 h-4" /></Button>}</div>
                      <p className="font-medium text-sm">{item.cliente}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.destino}</p>
                      {item.transportadora && <Badge variant="outline" className="mt-2 text-xs">{item.transportadora}</Badge>}
                    </div>
                  ))}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Truck, Clock, CheckCircle2, AlertTriangle, MapPin, Calendar, Download, Loader2, LucideIcon, Building2, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/useExport";
import { cn } from "@/lib/utils";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { VirtualizedList } from "@/components/common/VirtualizedList";
import { RealtimeBadge } from "@/components/common/RealtimeBadge";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { useRealtime } from "@/hooks/useRealtime";
import { PickupDialog } from "@/components/coletas/PickupDialog";
import { PickupDetailsDialog } from "@/components/coletas/PickupDetailsDialog";

import { Coleta, ColetaStatus } from "@/components/coletas/types";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

const statusConfig: Record<ColetaStatus, { label: string; color: string; icon: LucideIcon }> = {
  aguardando_liberacao: { label: "Aguardando", color: "bg-muted text-muted-foreground", icon: Clock },
  solicitada: { label: "Solicitada", color: "bg-primary/15 text-primary", icon: Package },
  em_transito: { label: "Em Trânsito", color: "bg-warning/15 text-warning", icon: Truck },
  chegou_expedicao: { label: "Na Expedição", color: "bg-accent text-accent-foreground", icon: Building2 },
  conferencia_ok: { label: "Conferida", color: "bg-success/15 text-success", icon: CheckCircle2 },
  divergencia: { label: "Divergência", color: "bg-destructive/15 text-destructive", icon: AlertTriangle },
  finalizada: { label: "Finalizada", color: "bg-success/20 text-success", icon: CheckCircle2 },
};

export default function Coletas() {
  const { exportToCSV } = useExport();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<Coleta | null>(null);
  const { playAction } = useAudioFeedback();

  const { data: coletas = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["coletas-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coletas")
        .select("*, fornecedores!fk_coletas_fornecedor(razao_social, nome_fantasia), transportadoras!fk_coletas_transportadora(nome_fantasia)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as Coleta[];
    },
    staleTime: QUERY_STALE_TIME.DYNAMIC,
  });

  useRealtime({ table: "coletas", queryKey: ["coletas-list"] });

  const filterConfig: FilterConfig<Coleta> = {
    search: { fields: ["numero_coleta", "endereco_coleta", "observacoes"], placeholder: "Buscar coletas..." },
    status: { field: "status", options: Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })), label: "Status" }
  };

  const { filteredData, filters, setSearch, setStatus, totalFiltered, totalOriginal } = useFilters(coletas, filterConfig);
  const { sortedData } = useSorting(filteredData, { defaultKey: "created_at", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });

  const stats = useMemo(() => ({ 
    total: coletas.length, 
    aguardando: coletas.filter(c => c.status === "aguardando_liberacao").length, 
    transito: coletas.filter(c => c.status === "em_transito").length, 
    finalizadas: coletas.filter(c => c.status === "finalizada").length 
  }), [coletas]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0 animate-in slide-in-from-left-6 duration-700 ease-out-expo">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground flex items-center gap-3 sm:gap-4 tracking-tighter">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 group cursor-pointer transition-transform hover:rotate-6">
                  <Package className="w-6 h-6 sm:w-9 sm:h-9 text-white animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="truncate drop-shadow-sm">Coletas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.2em]">Fluxo de Entrada Nexus</span>
                    <RealtimeBadge isSyncing={loading} className="scale-90" />
                  </div>
                </div>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl font-medium">Gestão inteligente e rastreamento de suprimentos de fornecedores em escala global.</p>
          </div>
          <div className="flex gap-3 animate-in slide-in-from-right-6 duration-700 ease-out-expo">
            <Button variant="outline" size="lg" onClick={() => exportToCSV(coletas as any, { filename: "coletas" })} className="h-12 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[11px] gap-2 hover:bg-primary/5 transition-all">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button size="lg" onClick={() => { setSelectedPickup(null); setIsDialogOpen(true); }} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] gap-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all">
              <Plus className="w-5 h-5" /> Nova Coleta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-200">
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums">{stats.total}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Total Geral</p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-muted/20 text-muted-foreground group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-muted-foreground">{stats.aguardando}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Aguardando</p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-warning/10 text-warning group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-warning">{stats.transito}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Em Trânsito</p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-success/10 text-success group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-success">{stats.finalizadas}</p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Finalizadas</p>
          </div>
        </div>

        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          status={filters.status}
          onStatusChange={setStatus}
          statusOptions={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))}
          totalFiltered={totalFiltered}
          totalOriginal={totalOriginal}
        />

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-h-[400px]">
            {pagination.paginatedData.length > 0 ? (
              <VirtualizedList
                items={pagination.paginatedData}
                estimateSize={120}
                className="max-h-[70vh] rounded-xl pr-2"
                renderItem={(c) => {
                  const Icon = statusConfig[c.status]?.icon || Package;
                  return (
                    <div className="pb-4">
                      <Card 
                        key={c.id} 
                        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                        onClick={() => { 
                          playAction();
                          setSelectedPickup(c); 
                          setIsDetailsOpen(true); 
                        }}
                      >
                        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-5 flex-1">
                            <div className={cn("p-4 rounded-2xl transition-all shadow-inner group-hover:scale-110 duration-500", statusConfig[c.status]?.color)}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="font-black text-xl tracking-tighter uppercase italic">{c.numero_coleta}</p>
                                <Badge variant="secondary" className="text-[10px] h-5 font-black uppercase tracking-widest px-2 bg-primary/5 text-primary border-primary/10">
                                  {c.tipo_coleta}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                                {(c.fornecedores as any)?.nome_fantasia || (c.fornecedores as any)?.razao_social}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-[2] bg-sidebar-accent/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                              <div className="p-2 rounded-lg bg-background shadow-sm"><MapPin className="w-4 h-4 text-primary" /></div>
                              <span className="truncate max-w-[150px] uppercase text-[11px] tracking-tight">{c.endereco_coleta}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                              <div className="p-2 rounded-lg bg-background shadow-sm"><Calendar className="w-4 h-4 text-primary" /></div>
                              <span className="uppercase text-[11px] tracking-tight">{c.data_prevista_coleta ? new Date(c.data_prevista_coleta).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                              <div className="p-2 rounded-lg bg-background shadow-sm"><Package className="w-4 h-4 text-primary" /></div>
                              <span className="uppercase text-[11px] tracking-tight">{c.qtd_volumes} VOLUMES</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <Badge className={cn("px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-sm", statusConfig[c.status]?.color)}>
                              {statusConfig[c.status]?.label}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                }}
              />
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Nenhuma coleta encontrada</p>
                <Button variant="link" onClick={() => { setSearch(""); setStatus("all"); }}>Limpar filtros</Button>
              </div>
            )}
          </div>
        )}
        
        <Pagination 
          currentPage={pagination.currentPage} 
          totalPages={pagination.totalPages} 
          onPageChange={pagination.setPage}
          pageSize={pagination.pageSize}
          totalItems={totalFiltered}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          pageSizeOptions={[10, 20, 50]}
          onPageSizeChange={pagination.setPageSize}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          onFirstPage={pagination.firstPage}
          onLastPage={pagination.lastPage}
        />
      </div>

      <PickupDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={refetch} 
        pickup={selectedPickup} 
      />

      <PickupDetailsDialog 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
        pickup={selectedPickup} 
        statusConfig={statusConfig} 
        onStatusUpdate={refetch} 
      />
    </MainLayout>
  );
}

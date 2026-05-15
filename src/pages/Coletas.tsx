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
        .select("*, fornecedores(razao_social, nome_fantasia), transportadoras(nome_fantasia)")
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2 sm:gap-3">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <span className="truncate">Coletas</span>
              </h1>
              <RealtimeBadge isSyncing={isSyncing} className="mt-1" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie coletas de fornecedores</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToCSV(coletas as any, { filename: "coletas" })}>
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
            <Button onClick={() => { setSelectedPickup(null); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex flex-col items-center justify-center">
            <Package className="w-5 h-5 text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex flex-col items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{stats.aguardando}</p>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex flex-col items-center justify-center">
            <Truck className="w-5 h-5 text-warning mb-1" />
            <p className="text-2xl font-bold">{stats.transito}</p>
            <p className="text-xs text-muted-foreground">Trânsito</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success mb-1" />
            <p className="text-2xl font-bold">{stats.finalizadas}</p>
            <p className="text-xs text-muted-foreground">Finalizadas</p>
          </CardContent></Card>
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
          <div className="grid grid-cols-1 gap-4">
            {pagination.paginatedData.map(c => {
              const Icon = statusConfig[c.status]?.icon || Package;
              return (
                <Card 
                  key={c.id} 
                  className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary group"
                  onClick={() => { 
                    playAction();
                    setSelectedPickup(c); 
                    setIsDetailsOpen(true); 
                  }}
                >
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn("p-2.5 rounded-xl transition-colors", statusConfig[c.status]?.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">{c.numero_coleta}</p>
                          <Badge variant="secondary" className="text-[10px] h-5 uppercase">
                            {c.tipo_coleta}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {(c.fornecedores as any)?.nome_fantasia || (c.fornecedores as any)?.razao_social}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary/60" /> 
                        <span className="truncate max-w-[150px]">{c.endereco_coleta}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary/60" /> 
                        {c.data_prevista_coleta ? new Date(c.data_prevista_coleta).toLocaleDateString() : '-'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4 text-primary/60" /> 
                        {c.qtd_volumes} vol
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={cn("px-3 py-1 capitalize", statusConfig[c.status]?.color)}>
                        {statusConfig[c.status]?.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {pagination.paginatedData.length === 0 && (
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
        onSuccess={fetchData} 
        pickup={selectedPickup} 
      />

      <PickupDetailsDialog 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
        pickup={selectedPickup} 
        statusConfig={statusConfig} 
        onStatusUpdate={fetchData} 
      />
    </MainLayout>
  );
}

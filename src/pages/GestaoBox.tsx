import { useState, useMemo, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { BoxGrid } from "@/components/box/BoxGrid";
import { BoxDetailModal } from "@/components/box/BoxDetailModal";
import { useBoxManagement, BoxData } from "@/hooks/useBoxManagement";
import { 
  Package, 
  Box, 
  TrendingUp, 
  Clock, 
  Loader2, 
  Trash2, 
  QrCode, 
  Zap, 
  ArrowRightLeft, 
  LayoutGrid,
  Search,
  CheckCircle2
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const filterConfig: FilterConfig<BoxData> = {
  search: {
    fields: ["number" as keyof BoxData],
    placeholder: "Buscar box..."
  }
};

export default function GestaoBox() {
  const { 
    boxes, 
    pendingDeliveries, 
    isLoading, 
    allocateToBox, 
    removeFromBox, 
    toggleCrossDocking 
  } = useBoxManagement();
  
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [scanValue, setScanValue] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  const boxesList = useMemo(() => (boxes || []).map((b, i) => ({ ...b, id: `box-${b.number}` })), [boxes]);
  
  const statusFiltered = useMemo(() => {
    if (statusFilter === "all") return boxesList;
    if (statusFilter === "ocupado") return boxesList.filter(b => b.isOccupied);
    if (statusFilter === "livre") return boxesList.filter(b => !b.isOccupied);
    if (statusFilter === "cross_docking") return boxesList.filter(b => b.isCrossDocking);
    return boxesList;
  }, [boxesList, statusFilter]);
  
  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(statusFiltered, filterConfig);
  const pagination = usePagination(filteredData, { initialPageSize: 16 });
  const { selectedIds, toggle, selectAll, clearSelection } = useSelection(pagination.paginatedData.map(b => ({ ...b, id: `box-${b.number}` })));

  const occupiedCount = boxes.filter((b) => b.isOccupied).length;
  const crossDockingCount = boxes.filter((b) => b.isCrossDocking).length;
  const occupancyRate = boxes.length > 0 ? Math.round((occupiedCount / boxes.length) * 100) : 0;

  const handleBoxClick = (box: BoxData) => { setSelectedBox(box); setIsModalOpen(true); };
  const handleDrop = async (boxNumber: number, deliveryId: string) => { await allocateToBox(boxNumber, deliveryId); };
  const handleRemoveFromBox = async (boxNumber: number) => { await removeFromBox(boxNumber); setIsModalOpen(false); };
  
  const bulkClear = async (ids: string[]) => { 
    const loadingToast = toast.loading("Liberando boxes...");
    try {
      for (const id of ids) { 
        const boxNum = parseInt(id.replace("box-", ""));
        const box = boxesList.find(b => b.number === boxNum); 
        if (box?.isOccupied) await removeFromBox(box.number); 
      } 
      toast.success("Boxes liberados com sucesso", { id: loadingToast });
      clearSelection();
    } catch (error) {
      toast.error("Erro ao liberar boxes", { id: loadingToast });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanValue.trim()) return;

    const delivery = pendingDeliveries.find(d => 
      d.numero_entrega.toLowerCase() === scanValue.toLowerCase() ||
      d.id.includes(scanValue)
    );

    if (delivery) {
      const freeBox = boxes.find(b => !b.isOccupied);
      if (freeBox) {
        await allocateToBox(freeBox.number, delivery.id);
        setScanValue("");
        toast.success(`Entrega ${delivery.numero_entrega} alocada no BOX ${freeBox.number}`);
      } else {
        toast.error("Nenhum box livre disponível");
      }
    } else {
      toast.error("Entrega não encontrada ou já alocada");
    }
  };

  const smartAllocate = async () => {
    if (pendingDeliveries.length === 0) {
      toast.info("Não há entregas pendentes para alocação");
      return;
    }

    const freeBoxes = boxes.filter(b => !b.isOccupied);
    if (freeBoxes.length === 0) {
      toast.error("Não há boxes livres disponíveis");
      return;
    }

    const toAllocate = Math.min(pendingDeliveries.length, freeBoxes.length);
    const loadingToast = toast.loading(`Alocando ${toAllocate} entregas...`);

    try {
      for (let i = 0; i < toAllocate; i++) {
        await allocateToBox(freeBoxes[i].number, pendingDeliveries[i].id);
      }
      toast.success("Alocação inteligente concluída", { id: loadingToast });
    } catch (error) {
      toast.error("Erro durante a alocação inteligente", { id: loadingToast });
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    setStatusFilter("all");
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Gestão de BOX</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Controle avançado de entrada e saída (Cross-docking)
                <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-1.5 h-4 border-primary/20 bg-primary/5">10/10 Pro</Badge>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleScan} className="relative group">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                ref={scanInputRef}
                placeholder="Escanear Código/NF..." 
                className="pl-10 w-[240px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
              />
            </form>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm" onClick={smartAllocate}>
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline">Inteligente</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alocação automática das entregas pendentes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-muted/5 border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <LayoutGrid className="w-5 h-5 text-primary mb-2 opacity-70" />
              <p className="text-2xl font-black text-foreground">{boxes.length}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total de Boxes</p>
            </CardContent>
          </Card>
          
          <Card className="bg-success/5 border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-5 h-5 text-success mb-2 opacity-70" />
              <p className="text-2xl font-black text-success">{boxes.length - occupiedCount}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Disponíveis</p>
            </CardContent>
          </Card>

          <Card className="bg-info/5 border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <ArrowRightLeft className="w-5 h-5 text-info mb-2 opacity-70" />
              <p className="text-2xl font-black text-info">{crossDockingCount}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Cross-docking</p>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="relative mb-2">
                <Clock className="w-5 h-5 text-warning opacity-70" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full animate-ping" />
              </div>
              <p className="text-2xl font-black text-warning">{occupancyRate}%</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Ocupação Atual</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg">
          <FilterBar 
            search={filters.search} 
            onSearchChange={setSearch} 
            searchPlaceholder="Buscar por número do box..." 
            status={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={[
              { value: "ocupado", label: "Ocupados" }, 
              { value: "livre", label: "Livres" },
              { value: "cross_docking", label: "Cross-docking" }
            ]}
            statusLabel="Filtrar por Status"
            onClearFilters={handleClearFilters} 
            hasActiveFilters={hasActiveFilters || statusFilter !== "all"} 
            totalFiltered={filteredData.length} 
            totalOriginal={boxesList.length} 
          />

          <div className="mt-6">
            {selectedIds.length > 0 && (
              <div className="mb-4 animate-in slide-in-from-top-4 duration-300">
                <BulkActions 
                  selectedIds={selectedIds} 
                  totalCount={pagination.paginatedData.length} 
                  onClearSelection={clearSelection} 
                  onSelectAll={() => {}} 
                  actions={[{ id: "clear", label: "Liberar Selecionados", icon: Trash2, variant: "destructive", onClick: bulkClear }]} 
                />
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                <p className="text-sm text-muted-foreground animate-pulse">Sincronizando mapa de boxes...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <BoxGrid boxes={pagination.paginatedData} onBoxClick={handleBoxClick} onDrop={handleDrop} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-xl border border-dashed border-border/50">
                <Search className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Nenhum box encontrado para os filtros atuais</p>
                <Button variant="link" onClick={handleClearFilters} className="text-primary mt-2">Limpar todos os filtros</Button>
              </div>
            )}
          </div>

          {filteredData.length > 16 && (
            <div className="mt-6 pt-6 border-t">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                pageSizeOptions={pagination.pageSizeOptions}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                onNextPage={pagination.nextPage}
                onPrevPage={pagination.prevPage}
                onFirstPage={pagination.firstPage}
                onLastPage={pagination.lastPage}
              />
            </div>
          )}
        </div>

        <BoxDetailModal 
          box={selectedBox} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onRemove={handleRemoveFromBox}
          onToggleCrossDocking={toggleCrossDocking}
        />
      </div>
    </MainLayout>
  );
}
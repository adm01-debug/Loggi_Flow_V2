import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { BoxGrid } from "@/components/box/BoxGrid";
import { BoxDetailModal } from "@/components/box/BoxDetailModal";
import { useBoxManagement, BoxData } from "@/hooks/useBoxManagement";
import { Package, Box, TrendingUp, Clock, Loader2, Trash2 } from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";

const filterConfig: FilterConfig<BoxData> = {
  search: {
    fields: ["number" as keyof BoxData],
    placeholder: "Buscar box..."
  }
};

export default function GestaoBox() {
  const { boxes, pendingDeliveries, isLoading, allocateToBox, removeFromBox } = useBoxManagement();
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const boxesList = useMemo(() => (boxes || []).map((b, i) => ({ ...b, id: `box-${b.number}` })), [boxes]);
  
  // Apply status filter manually
  const statusFiltered = useMemo(() => {
    if (statusFilter === "all") return boxesList;
    if (statusFilter === "ocupado") return boxesList.filter(b => b.isOccupied);
    if (statusFilter === "livre") return boxesList.filter(b => !b.isOccupied);
    return boxesList;
  }, [boxesList, statusFilter]);
  
  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(statusFiltered, filterConfig);
  const pagination = usePagination(filteredData, { initialPageSize: 16 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData.map(b => ({ ...b, id: `box-${b.number}` })));

  const occupiedCount = boxes.filter((b) => b.isOccupied).length;
  const availableCount = boxes.filter((b) => !b.isOccupied).length;
  const occupancyRate = boxes.length > 0 ? Math.round((occupiedCount / boxes.length) * 100) : 0;

  const handleBoxClick = (box: BoxData) => { setSelectedBox(box); setIsModalOpen(true); };
  const handleDrop = async (boxNumber: number, deliveryId: string) => { await allocateToBox(boxNumber, deliveryId); };
  const handleRemoveFromBox = async (boxNumber: number) => { await removeFromBox(boxNumber); setIsModalOpen(false); };
  const bulkClear = async (ids: string[]) => { 
    for (const id of ids) { 
      const boxNum = parseInt(id.replace("box-", ""));
      const box = boxesList.find(b => b.number === boxNum); 
      if (box?.isOccupied) await removeFromBox(box.number); 
    } 
    clearSelection(); 
  };

  const handleClearFilters = () => {
    clearFilters();
    setStatusFilter("all");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5"><Box className="w-6 h-6 text-primary" /></div>Gestão de BOX</h1><p className="text-muted-foreground mt-1">Mapa interativo dos 16 boxes</p></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><Box className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{boxes.length}</p><p className="text-xs text-muted-foreground">Total Boxes</p></div>
          <div className="stat-card text-center"><Package className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{occupiedCount}</p><p className="text-xs text-muted-foreground">Ocupados</p></div>
          <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{availableCount}</p><p className="text-xs text-muted-foreground">Disponíveis</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{occupancyRate}%</p><p className="text-xs text-muted-foreground">Ocupação</p></div>
        </div>
        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar box..." 
          status={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={[{ value: "ocupado", label: "Ocupados" }, { value: "livre", label: "Livres" }]}
          statusLabel="Status"
          onClearFilters={handleClearFilters} 
          hasActiveFilters={hasActiveFilters || statusFilter !== "all"} 
          totalFiltered={filteredData.length} 
          totalOriginal={boxesList.length} 
        />
        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "clear", label: "Liberar", icon: Trash2, variant: "destructive", onClick: bulkClear }]} />}
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : <BoxGrid boxes={pagination.paginatedData} onBoxClick={handleBoxClick} onDrop={handleDrop} />}
        {filteredData.length > 16 && (
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
        )}
        <BoxDetailModal box={selectedBox} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRemove={handleRemoveFromBox} />
      </div>
    </MainLayout>
  );
}
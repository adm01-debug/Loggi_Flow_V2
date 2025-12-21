import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BoxGrid } from "@/components/box/BoxGrid";
import { BoxDetailModal } from "@/components/box/BoxDetailModal";
import { useBoxManagement, BoxData } from "@/hooks/useBoxManagement";
import { Package, Box, TrendingUp, Clock, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useRealtime } from "@/hooks/useRealtime";

const filterConfig: FilterConfig<BoxData>[] = [
  { key: "status", type: "custom", filterFn: (item, value) => value === "ocupado" ? item.isOccupied : value === "livre" ? !item.isOccupied : true }
];

export default function GestaoBox() {
  const { boxes, pendingDeliveries, isLoading, allocateToBox, removeFromBox, refetch } = useBoxManagement();
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useRealtime({ table: "boxes", onInsert: () => refetch?.(), onUpdate: () => refetch?.() });

  const boxesList = useMemo(() => (boxes || []).map((b, i) => ({ ...b, id: b.id || `box-${i}` })), [boxes]);
  const { filteredData, filters, setFilter, clearFilters, hasActiveFilters } = useFilters(boxesList, filterConfig);
  const { paginatedData, currentPage, totalPages, pageSize, setPageSize, goToPage, hasNextPage, hasPrevPage } = usePagination(filteredData, { initialPageSize: 16 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(paginatedData);

  const occupiedCount = boxes.filter((b) => b.isOccupied).length;
  const availableCount = boxes.filter((b) => !b.isOccupied).length;
  const occupancyRate = boxes.length > 0 ? Math.round((occupiedCount / boxes.length) * 100) : 0;

  const handleBoxClick = (box: BoxData) => { setSelectedBox(box); setIsModalOpen(true); };
  const handleDrop = async (boxNumber: number, deliveryId: string) => { await allocateToBox(boxNumber, deliveryId); };
  const handleRemoveFromBox = async (boxNumber: number) => { await removeFromBox(boxNumber); setIsModalOpen(false); };
  const bulkClear = async (ids: string[]) => { for (const id of ids) { const box = boxesList.find(b => b.id === id); if (box?.isOccupied) await removeFromBox(box.boxNumber); } clearSelection(); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400/20 to-indigo-600/10"><Box className="w-6 h-6 text-indigo-500" /></div>Gestão de BOX</h1><p className="text-muted-foreground mt-1">Mapa interativo dos 16 boxes</p></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><Box className="w-5 h-5 text-indigo-500 mx-auto mb-2" /><p className="text-2xl font-bold">{boxes.length}</p><p className="text-xs text-muted-foreground">Total Boxes</p></div>
          <div className="stat-card text-center"><Package className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{occupiedCount}</p><p className="text-xs text-muted-foreground">Ocupados</p></div>
          <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{availableCount}</p><p className="text-xs text-muted-foreground">Disponíveis</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">{occupancyRate}%</p><p className="text-xs text-muted-foreground">Ocupação</p></div>
        </div>
        <FilterBar searchValue="" onSearchChange={() => {}} searchPlaceholder="Buscar box..." filters={[{ key: "status", label: "Status", type: "select", value: filters.status as string || "", options: [{ value: "", label: "Todos" }, { value: "ocupado", label: "Ocupados" }, { value: "livre", label: "Livres" }], onChange: (v) => setFilter("status", v || undefined) }]} onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters} totalCount={filteredData.length} filteredCount={filteredData.length} />
        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "clear", label: "Liberar", icon: Trash2, variant: "destructive", onClick: bulkClear }]} />}
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : <BoxGrid boxes={paginatedData} onBoxClick={handleBoxClick} onDrop={handleDrop} selectedIds={selectedIds} onToggleSelect={toggle} isSelected={isSelected} />}
        {filteredData.length > 16 && <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filteredData.length} onPageChange={goToPage} onPageSizeChange={setPageSize} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />}
        <BoxDetailModal box={selectedBox} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRemove={handleRemoveFromBox} />
      </div>
    </MainLayout>
  );
}

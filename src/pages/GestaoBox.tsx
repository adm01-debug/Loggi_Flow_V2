import { useState, useMemo, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { BoxGrid } from "@/components/box/BoxGrid";
import { BoxDetailModal } from "@/components/box/BoxDetailModal";
import {
  useBoxManagement,
  BoxData,
  DeliveryWithRelations,
} from "@/hooks/logistics/useBoxManagement";
import {
  Box,
  Loader2,
  Trash2,
  QrCode,
  Zap,
  ArrowRightLeft,
  LayoutGrid,
  CheckCircle2,
  Clock,
  GripVertical,
  Package,
} from "lucide-react";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/common/useSelection";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const filterConfig: FilterConfig<BoxData> = {
  search: {
    fields: ["number" as keyof BoxData],
    placeholder: "Buscar box...",
  },
  status: {
    field: "isOccupied" as any,
    options: [
      { value: "ocupado", label: "Ocupados" },
      { value: "livre", label: "Livres" },
      { value: "cross_docking", label: "Cross-docking" },
    ],
  },
  select: {
    zone: {
      field: "zone" as any,
      options: [
        { value: "norte", label: "Zona Norte" },
        { value: "sul", label: "Zona Sul" },
        { value: "local", label: "Local" },
        { value: "expresso", label: "Expresso" },
      ],
      label: "Zona de Carga",
    },
  },
};

function PendingDeliveryCard({
  delivery,
}: {
  delivery: DeliveryWithRelations;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("deliveryId", delivery.id);
    e.dataTransfer.setData("version", delivery.version.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50" />
          <span className="font-mono text-[10px] font-bold text-primary">
            {delivery.numero_entrega}
          </span>
        </div>
        {delivery.isUrgent && (
          <Badge
            variant="destructive"
            className="h-4 px-1 text-[8px] animate-pulse"
          >
            URGENTE
          </Badge>
        )}
      </div>
      <p className="text-[11px] font-medium truncate">
        {delivery.cliente?.razao_social}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <Package className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-[9px] text-muted-foreground truncate">
          {delivery.endereco_entrega}
        </span>
      </div>
    </div>
  );
}

export default function GestaoBox() {
  const {
    boxes,
    pendingDeliveries,
    isLoading,
    allocateToBox,
    removeFromBox,
    toggleCrossDocking,
  } = useBoxManagement();
  const { playSuccess, playError, playAction } = useAudioFeedback();

  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  const boxesList = useMemo(
    () => (boxes || []).map((b, i) => ({ ...b, id: `box-${b.number}` })),
    [boxes],
  );

  const {
    filteredData,
    filters,
    setSearch,
    setStatus,
    clearFilters,
    hasActiveFilters,
  } = useFilters(boxesList, filterConfig);
  const pagination = usePagination(filteredData, { initialPageSize: 16 });
  const { selectedIds, clearSelection } = useSelection(
    pagination.paginatedData,
  );

  const occupiedCount = boxes.filter((b) => b.isOccupied).length;
  const crossDockingCount = boxes.filter((b) => b.isCrossDocking).length;
  const occupancyRate =
    boxes.length > 0 ? Math.round((occupiedCount / boxes.length) * 100) : 0;

  const handleBoxClick = (box: BoxData) => {
    setSelectedBox(box);
    setIsModalOpen(true);
  };
  const handleDrop = async (
    boxNumber: number,
    deliveryId: string,
    version: number,
  ) => {
    playAction();
    await allocateToBox(boxNumber, deliveryId, version);
  };
  const handleRemoveFromBox = async (boxNumber: number) => {
    playAction();
    await removeFromBox(boxNumber);
    setIsModalOpen(false);
  };

  const bulkClear = async (ids: string[]) => {
    const loadingToast = toast.loading("Liberando boxes...");
    try {
      for (const id of ids) {
        const boxNum = parseInt(id.replace("box-", ""));
        const box = boxesList.find((b) => b.number === boxNum);
        if (box?.isOccupied) await removeFromBox(box.number);
      }
      toast.success("Boxes liberados com sucesso", { id: loadingToast });
      clearSelection();
    } catch {
      toast.error("Erro ao liberar boxes", { id: loadingToast });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanValue.trim()) return;

    const delivery = pendingDeliveries.find(
      (d) =>
        d.numero_entrega.toLowerCase() === scanValue.toLowerCase() ||
        d.id.includes(scanValue),
    );

    if (delivery) {
      const freeBox = boxes.find((b) => !b.isOccupied);
      if (freeBox) {
        await allocateToBox(freeBox.number, delivery.id, delivery.version);
        setScanValue("");
      } else {
        toast.error("Nenhum box livre disponível");
      }
    } else {
      toast.error("Entrega não encontrada ou já alocada");
    }
  };

  const smartAllocate = async () => {
    if (pendingDeliveries.length === 0) {
      toast.info("Não há entregas pendentes");
      return;
    }

    const freeBoxes = boxes.filter((b) => !b.isOccupied);
    if (freeBoxes.length === 0) {
      toast.error("Não há boxes livres");
      return;
    }

    const toAllocate = Math.min(pendingDeliveries.length, freeBoxes.length);
    const loadingToast = toast.loading(`Alocando ${toAllocate} entregas...`);

    try {
      for (let i = 0; i < toAllocate; i++) {
        await allocateToBox(
          freeBoxes[i].number,
          pendingDeliveries[i].id,
          pendingDeliveries[i].version,
        );
      }
      toast.success("Alocação inteligente concluída", { id: loadingToast });
    } catch {
      toast.error("Erro na alocação inteligente", { id: loadingToast });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Box className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Gestão de Box</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Warehouse_Intelligence
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    ALOCAÇÃO INTELIGENTE • CROSS-DOCKING
                  </span>
                </div>
              </div>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleScan} className="relative group">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                ref={scanInputRef}
                placeholder="Escanear Código/NF..."
                className="pl-10 w-[240px] bg-muted/30 border-none"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
              />
            </form>
            <Button
              variant="outline"
              className="gap-2 border-primary/20 hover:bg-primary/5"
              onClick={smartAllocate}
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Smart Allocate</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Boxes",
              val: boxes.length,
              icon: LayoutGrid,
              color: "text-primary",
              bg: "bg-primary/5",
            },
            {
              label: "Disponíveis",
              val: boxes.length - occupiedCount,
              icon: CheckCircle2,
              color: "text-success",
              bg: "bg-success/5",
            },
            {
              label: "Cross-docking",
              val: crossDockingCount,
              icon: ArrowRightLeft,
              color: "text-info",
              bg: "bg-info/5",
            },
            {
              label: "Ocupação",
              val: `${occupancyRate}%`,
              icon: Clock,
              color: "text-warning",
              bg: "bg-warning/5",
            },
          ].map((stat, i) => (
            <Card key={i} className={cn("border-none shadow-sm", stat.bg)}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <stat.icon
                  className={cn("w-5 h-5 mb-2 opacity-70", stat.color)}
                />
                <p className={cn("text-2xl font-black", stat.color)}>
                  {stat.val}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Pending Deliveries Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="h-full bg-muted/20 border-none overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Pendentes
                </h3>
                <Badge variant="secondary" className="font-black">
                  {pendingDeliveries.length}
                </Badge>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {pendingDeliveries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                      <CheckCircle2 className="w-8 h-8 mb-2" />
                      <p className="text-[10px] uppercase font-bold">
                        Tudo alocado
                      </p>
                    </div>
                  ) : (
                    pendingDeliveries.map((d) => (
                      <PendingDeliveryCard key={d.id} delivery={d} />
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 bg-primary/5 text-center">
                <p className="text-[9px] text-primary/70 font-medium">
                  Arraste para um box livre
                </p>
              </div>
            </Card>
          </div>

          {/* Boxes Grid */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg">
              <FilterBar
                search={filters.search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar box..."
                status={filters.status}
                onStatusChange={setStatus}
                statusOptions={filterConfig.status?.options}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                totalFiltered={filteredData.length}
                totalOriginal={boxesList.length}
              />

              <div className="mt-6">
                {selectedIds.length > 0 && (
                  <div className="mb-4">
                    <BulkActions
                      selectedIds={selectedIds}
                      totalCount={pagination.paginatedData.length}
                      onClearSelection={clearSelection}
                      actions={[
                        {
                          id: "clear",
                          label: "Liberar Selecionados",
                          icon: Trash2,
                          variant: "destructive",
                          onClick: bulkClear,
                        },
                      ]}
                    />
                  </div>
                )}

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                  </div>
                ) : (
                  <BoxGrid
                    boxes={pagination.paginatedData}
                    onBoxClick={handleBoxClick}
                    onDrop={handleDrop}
                  />
                )}
              </div>
            </div>
          </div>
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

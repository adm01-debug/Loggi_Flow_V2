import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BoxGrid } from "@/components/box/BoxGrid";
import { BoxDetailModal } from "@/components/box/BoxDetailModal";
import { useBoxManagement, BoxData } from "@/hooks/useBoxManagement";
import { motion } from "framer-motion";
import { Package, Box, TrendingUp, Clock, AlertTriangle } from "lucide-react";

export default function GestaoBox() {
  const { boxes, pendingDeliveries, isLoading, allocateToBox, removeFromBox } = useBoxManagement();
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const occupiedCount = boxes.filter((b) => b.isOccupied).length;
  const availableCount = boxes.filter((b) => !b.isOccupied).length;
  const occupancyRate = Math.round((occupiedCount / boxes.length) * 100);

  const handleBoxClick = (box: BoxData) => {
    setSelectedBox(box);
    setIsModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, deliveryId: string) => {
    e.dataTransfer.setData("deliveryId", deliveryId);
  };

  const handleDrop = async (boxNumber: number, deliveryId: string) => {
    await allocateToBox(boxNumber, deliveryId);
  };

  const handleRemoveFromBox = async (boxNumber: number) => {
    await removeFromBox(boxNumber);
    setIsModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground">Gestão de BOX</h1>
            <p className="text-muted-foreground mt-1">
              Mapa interativo dos 16 boxes para alocação de entregas
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card text-center"
          >
            <Box className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{boxes.length}</p>
            <p className="text-xs text-muted-foreground">Total de Boxes</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="stat-card text-center"
          >
            <Package className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{occupiedCount}</p>
            <p className="text-xs text-muted-foreground">Ocupados</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card text-center"
          >
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{availableCount}</p>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card text-center"
          >
            <TrendingUp className="w-5 h-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{occupancyRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa Ocupação</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Box Grid */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  Mapa de Boxes
                </CardTitle>
                <CardDescription>
                  Clique em um box para ver detalhes ou arraste entregas para alocar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BoxGrid
                  boxes={boxes}
                  onBoxClick={handleBoxClick}
                  onDrop={handleDrop}
                  isLoading={isLoading}
                />
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-success/20 border border-success" />
                    <span className="text-sm text-muted-foreground">Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-warning/20 border border-warning" />
                    <span className="text-sm text-muted-foreground">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive" />
                    <span className="text-sm text-muted-foreground">Urgente</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Deliveries Sidebar */}
          <div>
            <Card className="border-border h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  Entregas Pendentes
                </CardTitle>
                <CardDescription>
                  Arraste para alocar em um box
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] px-6 pb-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : pendingDeliveries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma entrega pendente para alocar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingDeliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, delivery.id)}
                          className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {delivery.numero_entrega}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {delivery.cliente?.razao_social || "Cliente não informado"}
                              </p>
                            </div>
                            {delivery.isUrgent && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Urgente
                              </Badge>
                            )}
                          </div>
                          <Separator className="my-2" />
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {delivery.endereco_entrega}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Box Detail Modal */}
        <BoxDetailModal
          box={selectedBox}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRemove={handleRemoveFromBox}
        />
      </div>
    </MainLayout>
  );
}

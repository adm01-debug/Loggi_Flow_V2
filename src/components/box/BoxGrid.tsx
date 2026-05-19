import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BoxData } from "@/hooks";
import { Package, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface BoxGridProps {
  boxes: BoxData[];
  onBoxClick: (box: BoxData) => void;
  onDrop: (boxNumber: number, deliveryId: string, version: number) => void;
  isLoading?: boolean;
}

export function BoxGrid({ boxes, onBoxClick, onDrop, isLoading }: BoxGridProps) {
  const [dragOverBox, setDragOverBox] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, boxNumber: number, isOccupied: boolean) => {
    e.preventDefault();
    if (!isOccupied) {
      setDragOverBox(boxNumber);
    }
  };

  const handleDragLeave = () => {
    setDragOverBox(null);
  };

  const handleDrop = (e: React.DragEvent, boxNumber: number, isOccupied: boolean) => {
    e.preventDefault();
    setDragOverBox(null);
    
    if (isOccupied) return;
    
    const deliveryId = e.dataTransfer.getData("deliveryId");
    const version = parseInt(e.dataTransfer.getData("version") || "0");
    if (deliveryId) {
      onDrop(boxNumber, deliveryId, version);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {boxes.map((box, index) => {
        const isDragOver = dragOverBox === box.number && !box.isOccupied;
        
        let bgColorClass = "bg-background border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5";
        if (box.isOccupied) {
          if (box.isUrgent) {
            bgColorClass = "bg-destructive/10 border-destructive hover:bg-destructive/20 shadow-sm";
          } else if (box.isCrossDocking) {
            bgColorClass = "bg-info/10 border-info hover:bg-info/20 shadow-sm";
          } else {
            bgColorClass = "bg-warning/10 border-warning hover:bg-warning/20 shadow-sm";
          }
        }

        return (
          <motion.div
            key={box.number}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onBoxClick(box)}
            onDragOver={(e) => handleDragOver(e, box.number, box.isOccupied)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, box.number, box.isOccupied)}
            className={cn(
              "aspect-square rounded-xl border-2 p-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 relative overflow-hidden group",
              bgColorClass,
              isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
            )}
          >
            {/* Box Number */}
            <span className="absolute top-1.5 left-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              B{box.number.toString().padStart(2, "0")}
            </span>

            {/* Cross Docking Badge */}
            {box.isOccupied && box.isCrossDocking && (
              <div className="absolute top-1 right-1">
                <Badge variant="info" className="h-4 px-1 text-[8px] font-bold uppercase animate-pulse">
                  CD
                </Badge>
              </div>
            )}

            {/* Status Icon */}
            {box.isOccupied ? (
              <>
                <div className="relative">
                  {box.isUrgent ? (
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  ) : box.isCrossDocking ? (
                    <ArrowRightLeft className="w-6 h-6 text-info" />
                  ) : (
                    <Package className="w-6 h-6 text-warning" />
                  )}
                  {box.isUrgent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"
                    />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-center line-clamp-2 px-1 text-foreground/80 group-hover:text-foreground">
                  {box.delivery?.numero_entrega}
                </span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-muted-foreground font-medium group-hover:text-primary">Livre</span>
              </>
            )}

            {/* Selection Overlay */}
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-primary/20 rounded-xl flex items-center justify-center"
              >
                <Package className="w-8 h-8 text-primary" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

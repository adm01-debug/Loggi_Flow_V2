import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BoxData } from "@/hooks/useBoxManagement";
import { Package, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface BoxGridProps {
  boxes: BoxData[];
  onBoxClick: (box: BoxData) => void;
  onDrop: (boxNumber: number, deliveryId: string) => void;
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
    if (deliveryId) {
      onDrop(boxNumber, deliveryId);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
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
    <div className="grid grid-cols-4 gap-3">
      {boxes.map((box, index) => {
        const isDragOver = dragOverBox === box.number && !box.isOccupied;
        
        return (
          <motion.div
            key={box.number}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onBoxClick(box)}
            onDragOver={(e) => handleDragOver(e, box.number, box.isOccupied)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, box.number, box.isOccupied)}
            className={cn(
              "aspect-square rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 relative overflow-hidden",
              box.isOccupied
                ? box.isUrgent
                  ? "bg-destructive/10 border-destructive hover:bg-destructive/20"
                  : "bg-warning/10 border-warning hover:bg-warning/20"
                : "bg-success/10 border-success/50 hover:border-success hover:bg-success/20",
              isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
            )}
          >
            {/* Box Number */}
            <span className="absolute top-2 left-2 text-xs font-bold text-muted-foreground">
              {box.number.toString().padStart(2, "0")}
            </span>

            {/* Status Icon */}
            {box.isOccupied ? (
              <>
                {box.isUrgent ? (
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                ) : (
                  <Package className="w-6 h-6 text-warning" />
                )}
                <span className="text-xs font-medium text-center line-clamp-2 px-1">
                  {box.delivery?.numero_entrega || "Ocupado"}
                </span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-success/50" />
                <span className="text-xs text-muted-foreground">Livre</span>
              </>
            )}

            {/* Urgency Indicator */}
            {box.isUrgent && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 border-2 border-destructive rounded-xl pointer-events-none"
              />
            )}

            {/* Drag Over Indicator */}
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

import { ReactNode } from "react";
import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  id: string;
  title?: string;
  children: ReactNode;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  className?: string;
}

export function DashboardWidget({
  id,
  title,
  children,
  isEditMode,
  onRemove,
  className,
}: DashboardWidgetProps) {
  return (
    <Card
      className={cn(
        "h-full overflow-hidden relative transition-all duration-200",
        isEditMode && "ring-2 ring-primary/20 ring-dashed",
        className
      )}
    >
      {isEditMode && (
        <>
          <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing drag-handle">
            <GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 z-10 h-7 w-7 bg-destructive/10 hover:bg-destructive/20 text-destructive"
            onClick={() => onRemove(id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
      <div className={cn("h-full", isEditMode && "pointer-events-none opacity-80")}>
        {children}
      </div>
    </Card>
  );
}

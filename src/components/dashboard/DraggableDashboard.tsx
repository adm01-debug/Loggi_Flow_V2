import { ReactNode, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  size?: "small" | "medium" | "large" | "full";
}

function SortableWidget({ id, children, isEditMode, onRemove, size = "medium" }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sizeClasses = {
    small: "col-span-1 md:col-span-1",
    medium: "col-span-2 md:col-span-1",
    large: "col-span-2",
    full: "col-span-2 md:col-span-4",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeClasses[size],
        isDragging && "z-50 opacity-80",
        "transition-all duration-200"
      )}
    >
      <Card
        className={cn(
          "h-full overflow-hidden relative",
          isEditMode && "ring-2 ring-primary/20 ring-dashed",
          isDragging && "shadow-xl"
        )}
      >
        {isEditMode && (
          <>
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
            >
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
    </div>
  );
}

export interface DashboardWidget {
  id: string;
  size: "small" | "medium" | "large" | "full";
  render: () => ReactNode;
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[];
  isEditMode: boolean;
  onReorder: (widgets: DashboardWidget[]) => void;
  onRemove: (id: string) => void;
}

export function DraggableDashboard({
  widgets,
  isEditMode,
  onReorder,
  onRemove,
}: DraggableDashboardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      onReorder(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {widgets.map((widget) => (
            <SortableWidget
              key={widget.id}
              id={widget.id}
              isEditMode={isEditMode}
              onRemove={onRemove}
              size={widget.size}
            >
              {widget.render()}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

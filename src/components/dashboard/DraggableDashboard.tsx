import React, { ReactNode, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripVertical, Plus, Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type WidgetSize = "small" | "medium" | "large" | "full";

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  size?: WidgetSize;
  isDragging?: boolean;
}

export interface DashboardWidget {
  id: string;
  size: WidgetSize;
  render: () => React.ReactNode;
}

const SortableWidget = React.forwardRef<HTMLDivElement, SortableWidgetProps>(
  ({ id, children, isEditMode, onRemove, size = "medium", isDragging }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isSorting,
    } = useSortable({ id, disabled: !isEditMode });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const sizeClasses = {
      small: "col-span-1",
      medium: "col-span-1 sm:col-span-2 md:col-span-1",
      large: "col-span-2",
      full: "col-span-2 md:col-span-4",
    };

    // Merge refs
    const mergedRef = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <motion.div
        ref={mergedRef}
        style={style}
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: isSorting ? 0.3 : 1, 
          scale: isSorting ? 0.98 : 1,
          zIndex: isSorting ? 50 : 1
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "circOut" }}
        className={cn(
          sizeClasses[size],
          "transition-all duration-300 relative group/sortable"
        )}
      >
        <div
          className={cn(
            "h-full rounded-[2.5rem] transition-all duration-500",
            isEditMode && "ring-2 ring-primary/40 ring-dashed bg-primary/5 p-2",
            isSorting && "shadow-2xl ring-primary scale-[1.02]"
          )}
        >
          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[2.5rem] overflow-hidden"
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(234,56,76,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(234,56,76,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
                
                <div className="relative flex flex-col items-center gap-6 p-8">
                   <div className="flex items-center gap-4">
                      <motion.div
                        {...attributes}
                        {...listeners}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9, rotate: -5 }}
                        className="cursor-grab active:cursor-grabbing w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-[0_0_30px_rgba(234,56,76,0.5)] border-2 border-white/20"
                      >
                        <GripVertical className="w-8 h-8" />
                      </motion.div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9, rotate: 5 }}
                        className="w-16 h-16 rounded-2xl bg-black border-2 border-destructive/50 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all shadow-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(id);
                        }}
                      >
                        <X className="w-8 h-8" />
                      </motion.button>
                   </div>
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Módulo Nexus</span>
                      <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest italic">{id.replace(/-/g, '_').toUpperCase()}</span>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={cn("h-full transition-all duration-500", isEditMode && "blur-sm grayscale opacity-40 scale-[0.98]")}>
            {children}
          </div>
        </div>
      </motion.div>
    );
  }
);
SortableWidget.displayName = "SortableWidget";

export interface DashboardWidget {
  id: string;
  size: "small" | "medium" | "large" | "full";
  render: () => ReactNode;
  title?: string;
  category?: string;
}

interface AvailableWidget {
  id: string;
  title: string;
  description: string;
  category: string;
  size: "small" | "medium" | "large" | "full";
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[];
  isEditMode: boolean;
  onReorder: (widgets: DashboardWidget[]) => void;
  onRemove: (id: string) => void;
  onAdd?: (widgetId: string) => void;
  onReset?: () => void;
  availableWidgets?: AvailableWidget[];
  onToggleEditMode?: () => void;
}

export function DraggableDashboard({
  widgets,
  isEditMode,
  onReorder,
  onRemove,
  onAdd,
  onReset,
  availableWidgets = [],
  onToggleEditMode,
}: DraggableDashboardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      onReorder(arrayMove(widgets, oldIndex, newIndex));
    }
  }, [widgets, onReorder]);

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;
  const widgetsToAdd = availableWidgets.filter(
    (aw) => !widgets.some((w) => w.id === aw.id)
  );

  const categorizedWidgets = widgetsToAdd.reduce((acc, w) => {
    if (!acc[w.category]) acc[w.category] = [];
    acc[w.category].push(w);
    return acc;
  }, {} as Record<string, AvailableWidget[]>);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Modo Edição
              </Badge>
              {widgetsToAdd.length > 0 && onAdd && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Adicionar Widget
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {Object.entries(categorizedWidgets).map(([category, categoryWidgets]) => (
                      <div key={category}>
                        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                          {category}
                        </DropdownMenuLabel>
                        {categoryWidgets.map((w) => (
                          <DropdownMenuItem key={w.id} onClick={() => onAdd(w.id)}>
                            <div>
                              <p className="font-medium">{w.title}</p>
                              <p className="text-xs text-muted-foreground">{w.description}</p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {onReset && (
                <Button variant="ghost" size="sm" onClick={onReset} className="gap-1">
                  <RotateCcw className="w-4 h-4" />
                  Resetar
                </Button>
              )}
            </motion.div>
          )}
        </div>
        {onToggleEditMode && (
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleEditMode}
            className="gap-1"
          >
            <Settings2 className="w-4 h-4" />
            {isEditMode ? "Salvar Layout" : "Editar Dashboard"}
          </Button>
        )}
      </div>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
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
            </AnimatePresence>
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeWidget && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.05, rotate: 2 }}
              className="opacity-90"
            >
              <Card className="shadow-2xl ring-2 ring-primary/50 overflow-hidden">
                <div className="p-4 bg-muted/50">
                  <p className="text-sm font-medium text-center">
                    {activeWidget.title || activeWidget.id}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Settings2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Dashboard Vazio</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione widgets para personalizar seu dashboard
          </p>
          {onToggleEditMode && !isEditMode && (
            <Button onClick={onToggleEditMode} className="gap-1">
              <Plus className="w-4 h-4" />
              Começar a Personalizar
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
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
import {
  X,
  GripVertical,
  Plus,
  Settings2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  (
    { id, children, isEditMode, onRemove, size = "medium", isDragging },
    ref,
  ) => {
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
      if (typeof ref === "function") {
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
          zIndex: isSorting ? 50 : 1,
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "circOut" }}
        className={cn(
          sizeClasses[size],
          "transition-all duration-300 relative group/sortable",
        )}
      >
        <div
          className={cn(
            "h-full rounded-[2.5rem] transition-all duration-500",
            isEditMode && "ring-2 ring-primary/40 ring-dashed bg-primary/5 p-2",
            isSorting && "shadow-2xl ring-primary scale-[1.02]",
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
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">
                      Módulo Nexus
                    </span>
                    <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest italic">
                      {id.replace(/-/g, "_").toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className={cn(
              "h-full transition-all duration-500",
              isEditMode && "blur-sm grayscale opacity-40 scale-[0.98]",
            )}
          >
            {children}
          </div>
        </div>
      </motion.div>
    );
  },
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
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = widgets.findIndex((w) => w.id === active.id);
        const newIndex = widgets.findIndex((w) => w.id === over.id);
        onReorder(arrayMove(widgets, oldIndex, newIndex));
      }
    },
    [widgets, onReorder],
  );

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;
  const widgetsToAdd = availableWidgets.filter(
    (aw) => !widgets.some((w) => w.id === aw.id),
  );

  const categorizedWidgets = widgetsToAdd.reduce(
    (acc, w) => {
      if (!acc[w.category]) acc[w.category] = [];
      acc[w.category].push(w);
      return acc;
    },
    {} as Record<string, AvailableWidget[]>,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Tactical Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 py-6 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black italic uppercase tracking-widest text-sm leading-none">
                Workspace Core
              </span>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">
                Grid Management System
              </span>
            </div>
          </div>

          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 pl-6 border-l border-white/10"
              >
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30 px-4 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse"
                >
                  EDIT_MODE_ACTIVE
                </Badge>

                {widgetsToAdd.length > 0 && onAdd && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-6 rounded-xl bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        INJETAR WIDGET
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-72 bg-black/95 border-primary/20 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl"
                    >
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">
                        Módulos Disponíveis
                      </DropdownMenuLabel>
                      {Object.entries(categorizedWidgets).map(
                        ([category, categoryWidgets]) => (
                          <div key={category} className="mb-4 last:mb-0">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 px-2 italic">
                              {category}
                            </p>
                            <div className="space-y-1">
                              {categoryWidgets.map((w) => (
                                <DropdownMenuItem
                                  key={w.id}
                                  onClick={() => onAdd(w.id)}
                                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 cursor-pointer transition-all border border-transparent hover:border-primary/20"
                                >
                                  <div className="p-2 rounded-lg bg-white/5">
                                    <Settings2 className="w-3 h-3 text-white/60" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-white uppercase italic">
                                      {w.title}
                                    </p>
                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter line-clamp-1">
                                      {w.description}
                                    </p>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                      <DropdownMenuSeparator className="bg-white/10 my-3" />
                      {onReset && (
                        <DropdownMenuItem
                          onClick={onReset}
                          className="flex items-center justify-center gap-2 p-2 text-[9px] font-black text-white/30 hover:text-white transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> RESETAR GRID PADRÃO
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onToggleEditMode && (
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="lg"
            onClick={onToggleEditMode}
            className={cn(
              "h-12 px-10 rounded-full transition-all duration-500 font-black text-[11px] uppercase tracking-[0.2em] gap-3",
              isEditMode
                ? "bg-success text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] border-b-4 border-black/20"
                : "bg-white/5 border-white/10 text-white/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            {isEditMode ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <Settings2 className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            )}
            {isEditMode ? "FINALIZAR E SALVAR" : "PERSONALIZAR GRID"}
          </Button>
        )}
      </div>

      {/* Main Tactical Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
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

        {/* Tactical Drag Overlay */}
        <DragOverlay>
          {activeWidget && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.05, opacity: 0.9, rotate: 1 }}
              className="z-[100] cursor-grabbing"
            >
              <div className="relative p-1 rounded-[2.5rem] bg-primary shadow-[0_0_50px_rgba(234,56,76,0.6)]">
                <div className="bg-black rounded-[2.4rem] p-10 flex flex-col items-center justify-center gap-4">
                  <GripVertical className="w-10 h-10 text-primary animate-pulse" />
                  <div className="text-center">
                    <p className="text-sm font-black text-white italic uppercase tracking-widest">
                      {activeWidget.title || activeWidget.id}
                    </p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1">
                      REPOSICIONANDO MÓDULO
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Enhanced Empty State */}
      {widgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center bg-black/40 backdrop-blur-xl rounded-[4rem] border-4 border-dashed border-white/5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,56,76,0.1),transparent_70%)] animate-pulse" />
          <div className="relative z-10 space-y-8">
            <div className="p-10 rounded-full bg-primary/5 border border-primary/10 inline-block animate-bounce">
              <Settings2 className="w-16 h-16 text-primary/40" />
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-4xl font-black italic text-white tracking-tighter uppercase">
                Dashboard Desativado
              </h3>
              <p className="text-sm text-white/40 font-bold uppercase tracking-[0.2em] leading-relaxed">
                Nenhum módulo Nexus detectado na matriz operacional. Inicie a
                personalização para injetar novos widgets de comando.
              </p>
            </div>
            {onToggleEditMode && !isEditMode && (
              <Button
                onClick={onToggleEditMode}
                size="lg"
                className="h-14 px-12 rounded-full bg-primary text-white hover:bg-white hover:text-primary transition-all font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(234,56,76,0.5)] active:scale-95"
              >
                <Plus className="w-6 h-6 mr-3" />
                ATIVAR PERSONALIZAÇÃO
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

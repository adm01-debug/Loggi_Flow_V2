import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragOverEvent, rectIntersection, UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, horizontalListSortingStrategy,
  rectSortingStrategy, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, GripHorizontal, Trash2, Copy, Edit2,
  ChevronRight, ChevronDown, MoreHorizontal, Plus,
  Folder, File, Image as ImageIcon, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================
// SORTABLE ITEM (Basic)
// ============================================
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showHandle?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  className,
  disabled,
  showHandle = true,
  onRemove,
  onEdit,
  onDuplicate
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group bg-background border border-border rounded-lg p-3",
        "transition-shadow duration-200",
        isDragging && "shadow-xl ring-2 ring-primary/50 z-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.8 : 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        {showHandle && !disabled && (
          <motion.div
            {...attributes}
            {...listeners}
            className={cn(
              "p-1 rounded cursor-grab active:cursor-grabbing",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-all duration-200",
              "opacity-0 group-hover:opacity-100"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <GripVertical className="h-4 w-4" />
          </motion.div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Actions */}
        {(onRemove || onEdit || onDuplicate) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDuplicate && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {onRemove && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:text-destructive" 
                onClick={onRemove}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Drag indicator line */}
      {isDragging && (
        <motion.div
          className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full"
          layoutId="drag-indicator"
        />
      )}
    </motion.div>
  );
};

// ============================================
// SORTABLE LIST
// ============================================
interface SortableListItem {
  id: string;
  [key: string]: any;
}

interface SortableListProps<T extends SortableListItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  emptyState?: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}

export function SortableList<T extends SortableListItem>({
  items,
  onReorder,
  renderItem,
  direction = 'vertical',
  gap = 'md',
  className,
  emptyState,
  onAdd,
  addLabel = 'Adicionar item'
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  const gapSizes = { sm: 'gap-1', md: 'gap-2', lg: 'gap-4' };
  const activeItem = items.find((item) => item.id === activeId);

  const strategy = direction === 'vertical' 
    ? verticalListSortingStrategy 
    : horizontalListSortingStrategy;

  if (items.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        {emptyState}
        {onAdd && (
          <Button onClick={onAdd} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            {addLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={strategy}>
        <div className={cn(
          "flex",
          direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          gapSizes[gap],
          className
        )}>
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <SortableItem key={item.id} id={item.id}>
                {renderItem(item, index)}
              </SortableItem>
            ))}
          </AnimatePresence>

          {onAdd && (
            <motion.button
              onClick={onAdd}
              className={cn(
                "flex items-center justify-center gap-2 p-3 border-2 border-dashed border-muted rounded-lg",
                "text-muted-foreground hover:text-foreground hover:border-primary/50",
                "transition-colors duration-200"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">{addLabel}</span>
            </motion.button>
          )}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <motion.div
            initial={{ scale: 1.05 }}
            animate={{ scale: 1.05 }}
            className="bg-background border-2 border-primary rounded-lg p-3 shadow-xl"
          >
            {renderItem(activeItem, items.indexOf(activeItem))}
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================
// KANBAN BOARD
// ============================================
interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: { text: string; color: string }[];
  [key: string]: any;
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove: (cardId: string, fromColumn: string, toColumn: string, newIndex: number) => void;
  onCardClick?: (card: KanbanCard) => void;
  onAddCard?: (columnId: string) => void;
  renderCard?: (card: KanbanCard) => React.ReactNode;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onCardMove,
  onCardClick,
  onAddCard,
  renderCard
}) => {
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = columns
      .flatMap(col => col.cards)
      .find(c => c.id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as string;
    const overId = over.id as string;

    // Find source column
    const sourceColumn = columns.find(col => 
      col.cards.some(card => card.id === activeCardId)
    );
    
    if (!sourceColumn) return;

    // Check if dropped on a column header or card
    const targetColumn = columns.find(col => col.id === overId) ||
      columns.find(col => col.cards.some(card => card.id === overId));

    if (!targetColumn) return;

    // Calculate new index
    let newIndex = 0;
    if (overId !== targetColumn.id) {
      const overCardIndex = targetColumn.cards.findIndex(card => card.id === overId);
      newIndex = overCardIndex >= 0 ? overCardIndex : targetColumn.cards.length;
    } else {
      newIndex = targetColumn.cards.length;
    }

    if (sourceColumn.id !== targetColumn.id || 
        sourceColumn.cards.findIndex(c => c.id === activeCardId) !== newIndex) {
      onCardMove(activeCardId, sourceColumn.id, targetColumn.id, newIndex);
    }
  };

  const allCardIds = columns.flatMap(col => col.cards.map(c => c.id));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
            renderCard={renderCard}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <motion.div
            initial={{ rotate: 3, scale: 1.05 }}
            animate={{ rotate: 3, scale: 1.05 }}
            className="bg-background rounded-lg shadow-xl"
          >
            {renderCard ? renderCard(activeCard) : (
              <DefaultKanbanCard card={activeCard} />
            )}
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

const KanbanColumnComponent: React.FC<{
  column: KanbanColumn;
  onCardClick?: (card: KanbanCard) => void;
  onAddCard?: (columnId: string) => void;
  renderCard?: (card: KanbanCard) => React.ReactNode;
}> = ({ column, onCardClick, onAddCard, renderCard }) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column' }
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color || 'hsl(var(--primary))' }}
          />
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
        
        {onAddCard && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddCard(column.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Cards */}
      <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          <AnimatePresence mode="popLayout">
            {column.cards.map((card) => (
              <SortableKanbanCard
                key={card.id}
                card={card}
                onClick={() => onCardClick?.(card)}
                renderCard={renderCard}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
};

const SortableKanbanCard: React.FC<{
  card: KanbanCard;
  onClick?: () => void;
  renderCard?: (card: KanbanCard) => React.ReactNode;
}> = ({ card, onClick, renderCard }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {renderCard ? renderCard(card) : <DefaultKanbanCard card={card} />}
    </motion.div>
  );
};

const DefaultKanbanCard: React.FC<{ card: KanbanCard }> = ({ card }) => (
  <div className="bg-background border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
    <h4 className="text-sm font-medium mb-1">{card.title}</h4>
    {card.description && (
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {card.description}
      </p>
    )}
    {card.labels && card.labels.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {card.labels.map((label, idx) => (
          <span
            key={idx}
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: label.color + '20', color: label.color }}
          >
            {label.text}
          </span>
        ))}
      </div>
    )}
  </div>
);

// ============================================
// TREE VIEW (Draggable)
// ============================================
interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  data?: any;
}

interface TreeViewProps {
  nodes: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
  onNodeMove?: (nodeId: string, newParentId: string | null) => void;
  selectedId?: string;
  expandedIds?: string[];
  onToggleExpand?: (nodeId: string) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  onNodeClick,
  onNodeMove,
  selectedId,
  expandedIds = [],
  onToggleExpand
}) => {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          depth={0}
          onNodeClick={onNodeClick}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
};

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  depth: number;
  onNodeClick?: (node: TreeNode) => void;
  selectedId?: string;
  expandedIds: string[];
  onToggleExpand?: (nodeId: string) => void;
}> = ({ node, depth, onNodeClick, selectedId, expandedIds, onToggleExpand }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.includes(node.id);
  const isSelected = selectedId === node.id;

  const getDefaultIcon = () => {
    if (hasChildren) return <Folder className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div>
      <motion.div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer",
          "hover:bg-muted transition-colors",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onNodeClick?.(node)}
        whileHover={{ x: 2 }}
      >
        {/* Expand button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.(node.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Icon */}
        <div className="text-muted-foreground">
          {node.icon || getDefaultIcon()}
        </div>

        {/* Label */}
        <span className="text-sm truncate">{node.label}</span>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children!.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                onNodeClick={onNodeClick}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default {
  SortableItem,
  SortableList,
  KanbanBoard,
  TreeView
};

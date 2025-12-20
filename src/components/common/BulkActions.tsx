import * as React from "react";
import { X, Trash2, Download, Tag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive";
  onClick: (selectedIds: string[]) => void;
}

interface BulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActions({
  selectedIds,
  totalCount,
  onClearSelection,
  onSelectAll,
  actions,
  className,
}: BulkActionsProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-primary/5 border rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <span className="font-medium">
          {selectedIds.length} de {totalCount} selecionado(s)
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {onSelectAll && selectedIds.length < totalCount && (
          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            Selecionar todos
          </Button>
        )}

        {actions.length <= 3 ? (
          // Mostrar botões inline se poucos
          actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              size="sm"
              onClick={() => action.onClick(selectedIds)}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          ))
        ) : (
          // Dropdown se muitas ações
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => (
                <React.Fragment key={action.id}>
                  {action.variant === "destructive" && index > 0 && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    onClick={() => action.onClick(selectedIds)}
                    className={cn(
                      action.variant === "destructive" && "text-destructive"
                    )}
                  >
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="ghost" size="icon" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Hook para gerenciar seleção
export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggle = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = React.useCallback(() => {
    setSelectedIds(items.map((item) => item.id));
  }, [items]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = React.useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const isAllSelected = selectedIds.length === items.length && items.length > 0;
  const isPartialSelected = selectedIds.length > 0 && !isAllSelected;

  return {
    selectedIds,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
  };
}

export default BulkActions;

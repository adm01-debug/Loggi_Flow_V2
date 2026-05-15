import * as React from "react";

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

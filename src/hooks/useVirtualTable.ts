import { useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface UseVirtualTableOptions<T> {
  data: T[];
  estimateSize?: number;
  overscan?: number;
}

/**
 * Hook to virtualize a table body for large datasets.
 * Returns a ref for the scroll container + virtual row data.
 */
export function useVirtualTable<T>({
  data,
  estimateSize = 48,
  overscan = 10,
}: UseVirtualTableOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();

  const totalSize = virtualizer.getTotalSize();

  const getItem = useCallback(
    (index: number): T => data[index],
    [data]
  );

  return {
    parentRef,
    virtualRows,
    totalSize,
    getItem,
    virtualizer,
  };
}

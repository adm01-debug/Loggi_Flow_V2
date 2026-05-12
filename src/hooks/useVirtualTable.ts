import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface UseVirtualTableOptions {
  count: number;
  estimateSize?: number;
  overscan?: number;
}

export function useVirtualTable({ count, estimateSize = 60, overscan = 5 }: UseVirtualTableOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return {
    parentRef,
    rowVirtualizer,
    virtualItems: rowVirtualizer.getVirtualItems(),
    totalSize: rowVirtualizer.getTotalSize(),
    scrollToIndex: rowVirtualizer.scrollToIndex,
  };
}

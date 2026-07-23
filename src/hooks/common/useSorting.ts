/* eslint-disable sonarjs/cognitive-complexity */
import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortState<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface UseSortingOptions<T> {
  defaultKey?: keyof T;
  defaultDirection?: SortDirection;
}

export interface UseSortingReturn<T> {
  sortedData: T[];
  sortState: SortState<T>;
  toggleSort: (key: keyof T) => void;
  setSort: (key: keyof T | null, direction: SortDirection) => void;
  clearSort: () => void;
  getSortDirection: (key: keyof T) => SortDirection;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic constraint intentionally accepts any record shape
export function useSorting<T extends Record<string, any>>(
  data: T[],
  options: UseSortingOptions<T> = {}
): UseSortingReturn<T> {
  const { defaultKey = null, defaultDirection = null } = options;

  const [sortState, setSortState] = useState<SortState<T>>({
    key: defaultKey,
    direction: defaultDirection,
  });

  const toggleSort = useCallback((key: keyof T) => {
    setSortState((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const setSort = useCallback((key: keyof T | null, direction: SortDirection) => {
    setSortState({ key, direction });
  }, []);

  const clearSort = useCallback(() => {
    setSortState({ key: null, direction: null });
  }, []);

  const getSortDirection = useCallback(
    (key: keyof T): SortDirection => {
      return sortState.key === key ? sortState.direction : null;
    },
    [sortState]
  );

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortState.key as keyof T] as unknown;
      const bVal = b[sortState.key as keyof T] as unknown;

      // Handle nulls
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortState.direction === "asc" ? 1 : -1;
      if (bVal == null) return sortState.direction === "asc" ? -1 : 1;

      // Handle dates - check if values are Date objects
      if (typeof aVal === "object" && aVal instanceof Date && typeof bVal === "object" && bVal instanceof Date) {
        return sortState.direction === "asc"
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      // Handle strings (dates as strings)
      if (typeof aVal === "string" && typeof bVal === "string") {
        // Check if it's a date string
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return sortState.direction === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        }
        // Regular string comparison
        return sortState.direction === "asc"
          ? aVal.localeCompare(bVal, "pt-BR")
          : bVal.localeCompare(aVal, "pt-BR");
      }

      // Handle numbers
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Handle booleans
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        return sortState.direction === "asc"
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }

      // Fallback
      return 0;
    });

    return sorted;
  }, [data, sortState]);

  return {
    sortedData,
    sortState,
    toggleSort,
    setSort,
    clearSort,
    getSortDirection,
  };
}

export default useSorting;

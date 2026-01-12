import { useState, useMemo, useCallback } from "react";
import { DateRange } from "react-day-picker";

export interface FilterConfig<T> {
  search?: {
    fields: (keyof T)[];
    placeholder?: string;
  };
  dateRange?: {
    field: keyof T;
    label?: string;
  };
  status?: {
    field: keyof T;
    options: { value: string; label: string }[];
    label?: string;
  };
  select?: {
    [key: string]: {
      field: keyof T;
      options: { value: string; label: string }[];
      label?: string;
    };
  };
}

export interface FilterState {
  search: string;
  dateRange: DateRange | undefined;
  status: string;
  // Dynamic keys for custom select filters - using any to support index signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterValue = any;

// Using a generic constraint that allows any object type
export function useFilters<T extends object>(
  data: T[],
  config: FilterConfig<T>
) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    dateRange: undefined,
    status: "all",
  });

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const setDateRange = useCallback((value: DateRange | undefined) => {
    setFilters((prev) => ({ ...prev, dateRange: value }));
  }, []);

  const setStatus = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const setFilter = useCallback((key: string, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      dateRange: undefined,
      status: "all",
    });
  }, []);

  const filteredData = useMemo((): T[] => {
    let result = [...data];

    // Filtro de busca
    if (filters.search && config.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((item) =>
        config.search!.fields.some((field) => {
          const value = (item as Record<string, unknown>)[field as string];
          return value && String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Filtro de data
    if (filters.dateRange?.from && config.dateRange) {
      const { from, to } = filters.dateRange;
      result = result.filter((item) => {
        const itemDate = new Date((item as Record<string, unknown>)[config.dateRange!.field as string] as string);
        if (to) {
          return itemDate >= from && itemDate <= to;
        }
        return itemDate >= from;
      });
    }

    // Filtro de status
    if (filters.status && filters.status !== "all" && config.status) {
      result = result.filter(
        (item) => (item as Record<string, unknown>)[config.status!.field as string] === filters.status
      );
    }

    // Filtros customizados
    if (config.select) {
      Object.entries(config.select).forEach(([key, selectConfig]) => {
        const filterValue = filters[key];
        if (filterValue && filterValue !== "all") {
          result = result.filter(
            (item) => (item as Record<string, unknown>)[selectConfig.field as string] === filterValue
          );
        }
      });
    }

    return result;
  }, [data, filters, config]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.dateRange !== undefined ||
      filters.status !== "all" ||
      Object.keys(filters).some(
        (key) =>
          !["search", "dateRange", "status"].includes(key) &&
          filters[key] !== "all" &&
          filters[key] !== undefined
      )
    );
  }, [filters]);

  return {
    filters,
    filteredData,
    setSearch,
    setDateRange,
    setStatus,
    setFilter,
    clearFilters,
    hasActiveFilters,
    totalFiltered: filteredData.length,
    totalOriginal: data.length,
  };
}

export default useFilters;

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
  [key: string]: any;
}

export function useFilters<T extends Record<string, any>>(
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

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      dateRange: undefined,
      status: "all",
    });
  }, []);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Filtro de busca
    if (filters.search && config.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((item) =>
        config.search!.fields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Filtro de data
    if (filters.dateRange?.from && config.dateRange) {
      const { from, to } = filters.dateRange;
      result = result.filter((item) => {
        const itemDate = new Date(item[config.dateRange!.field] as string);
        if (to) {
          return itemDate >= from && itemDate <= to;
        }
        return itemDate >= from;
      });
    }

    // Filtro de status
    if (filters.status && filters.status !== "all" && config.status) {
      result = result.filter(
        (item) => item[config.status!.field] === filters.status
      );
    }

    // Filtros customizados
    if (config.select) {
      Object.entries(config.select).forEach(([key, selectConfig]) => {
        const filterValue = filters[key];
        if (filterValue && filterValue !== "all") {
          result = result.filter(
            (item) => item[selectConfig.field] === filterValue
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

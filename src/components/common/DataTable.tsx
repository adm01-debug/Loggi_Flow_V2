import { useState, useMemo, ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeletons";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  stickyHeader?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  searchable = true,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum dado encontrado",
  onRowClick,
  rowClassName,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Get nested value from object
  const getValue = (obj: T, key: string): unknown => {
    return key.split(".").reduce((acc: unknown, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!search) return data;
    const searchLower = search.toLowerCase();
    const searchableKeys = columns.filter((c) => c.searchable !== false).map((c) => c.key as string);

    return data.filter((row) =>
      searchableKeys.some((key) => {
        const value = getValue(row, key);
        return value !== null && value !== undefined && String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, search, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Reset page when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const SortIcon = ({ column }: { column: Column<T> }) => {
    if (!column.sortable) return null;
    const key = column.key as string;
    if (sortKey !== key) return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDir === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-8"
          />
          {search && (
            <button onClick={() => handleSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Mobile-friendly scrollable table container */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader className={cn(stickyHeader && "sticky top-0 bg-background z-10")}>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    style={{ width: col.width }}
                    className={cn(
                      "whitespace-nowrap",
                      col.sortable && "cursor-pointer select-none hover:bg-muted/50 active:bg-muted",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                    onClick={() => col.sortable && handleSort(col.key as string)}
                  >
                    <div className={cn("flex items-center", col.align === "center" && "justify-center", col.align === "right" && "justify-end")}>
                      {col.header}
                      <SortIcon column={col} />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    className={cn(
                      onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted",
                      rowClassName?.(row, rowIndex)
                    )}
                  >
                    {columns.map((col, colIndex) => {
                      const value = getValue(row, col.key as string);
                      return (
                        <TableCell 
                          key={colIndex} 
                          className={cn(
                            "whitespace-nowrap",
                            col.align === "center" && "text-center", 
                            col.align === "right" && "text-right"
                          )}
                        >
                          {col.render ? col.render(value, row, rowIndex) : value !== null && value !== undefined ? String(value) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Responsive pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 sm:order-1">
            <span className="hidden sm:inline">Mostrando</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-16 h-9 min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>{pageSizeOptions.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <span>de {sortedData.length}</span>
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 min-h-[44px] min-w-[44px]" 
              onClick={() => setPage(1)} 
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 min-h-[44px] min-w-[44px]" 
              onClick={() => setPage(page - 1)} 
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-sm font-medium min-w-[60px] text-center">{page} / {totalPages}</span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 min-h-[44px] min-w-[44px]" 
              onClick={() => setPage(page + 1)} 
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 min-h-[44px] min-w-[44px]" 
              onClick={() => setPage(totalPages)} 
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

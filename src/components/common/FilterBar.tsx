import { Search, X, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "./DateRangePicker";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  statusLabel?: string;
  
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  
  extraFilters?: {
    key: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    label: string;
  }[];
  
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  
  totalFiltered?: number;
  totalOriginal?: number;
  
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  status,
  onStatusChange,
  statusOptions,
  statusLabel = "Status",
  dateRange,
  onDateRangeChange,
  extraFilters,
  hasActiveFilters,
  onClearFilters,
  totalFiltered,
  totalOriginal,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Filters container - scrollable on mobile */}
      <div className="flex flex-col gap-3">
        {/* Search - always full width on mobile */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-9 h-11 min-h-[44px]"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter selects - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {/* Status */}
          {statusOptions && onStatusChange && (
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="min-w-[140px] sm:w-[180px] h-10 min-h-[44px] flex-shrink-0">
                <SelectValue placeholder={statusLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Range */}
          {onDateRangeChange && (
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              className="flex-shrink-0"
            />
          )}

          {/* Extra Filters */}
          {extraFilters?.map((filter) => (
            <Select
              key={filter.key}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="min-w-[130px] sm:w-[150px] h-10 min-h-[44px] flex-shrink-0">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      {/* Info Row - responsive */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-3 text-xs min-h-[36px]"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
          
          {totalFiltered !== undefined && totalOriginal !== undefined && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              {totalFiltered === totalOriginal
                ? `${totalOriginal} registros`
                : `${totalFiltered} de ${totalOriginal}`}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Filter className="h-3 w-3" />
            <span className="hidden sm:inline">Filtros ativos</span>
            <span className="sm:hidden">Filtrado</span>
          </Badge>
        )}
      </div>
    </div>
  );
}

export default FilterBar;

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
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status */}
        {statusOptions && onStatusChange && (
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            className="w-full sm:w-auto"
          />
        )}

        {/* Extra Filters */}
        {extraFilters?.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
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

      {/* Info Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar filtros
            </Button>
          )}
          
          {totalFiltered !== undefined && totalOriginal !== undefined && (
            <span className="text-sm text-muted-foreground">
              {totalFiltered === totalOriginal
                ? `${totalOriginal} registros`
                : `${totalFiltered} de ${totalOriginal} registros`}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3 w-3" />
            Filtros ativos
          </Badge>
        )}
      </div>
    </div>
  );
}

export default FilterBar;

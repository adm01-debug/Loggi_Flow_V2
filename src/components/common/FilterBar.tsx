import { Search, X, Filter } from "lucide-react";
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
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4">
        <div className="relative w-full group">
          <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-12 pr-12 h-14 rounded-2xl bg-sidebar-accent/50 border-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium placeholder:font-normal placeholder:text-muted-foreground/60"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-2 transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none items-center">
          <div className="flex items-center gap-2 p-1 bg-sidebar-accent/50 rounded-xl border border-white/5">
            <div className="p-2 rounded-lg bg-background shadow-sm">
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pr-2 hidden sm:inline">Refinar Grid</span>
          </div>

          {statusOptions && onStatusChange && (
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="min-w-[160px] h-12 rounded-xl bg-sidebar-accent/50 border-white/5 font-black uppercase tracking-widest text-[10px] gap-2">
                <SelectValue placeholder={statusLabel} />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                <SelectItem value="all" className="font-black uppercase tracking-widest text-[10px]">Todos os Status</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-black uppercase tracking-widest text-[10px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {onDateRangeChange && (
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              className="flex-shrink-0"
            />
          )}

          {extraFilters?.map((filter) => (
            <Select
              key={filter.key}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="min-w-[150px] h-12 rounded-xl bg-sidebar-accent/50 border-white/5 font-black uppercase tracking-widest text-[10px] gap-2">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                <SelectItem value="all" className="font-black uppercase tracking-widest text-[10px]">Todos</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-black uppercase tracking-widest text-[10px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all border border-primary/20"
            >
              <X className="h-3.5 w-3.5 mr-2" />
              Resetar Filtros
            </Button>
          )}
          
          {totalFiltered !== undefined && totalOriginal !== undefined && (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              {totalFiltered === totalOriginal
                ? `${totalOriginal} REGISTROS_SYNC`
                : `${totalFiltered} DE ${totalOriginal} FILTRADOS`}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Badge className="bg-primary/10 text-primary border-primary/30 px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            VUE_GRID_ACTIVE
          </Badge>
        )}
      </div>
    </div>
  );
}

export default FilterBar;

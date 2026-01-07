import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startIndex,
  endIndex,
  hasNextPage,
  hasPrevPage,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  onNextPage,
  onPrevPage,
  onFirstPage,
  onLastPage,
}: PaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4">
      {/* Info text - simplified on mobile */}
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
        <span className="hidden sm:inline">
          Mostrando {startIndex} a {endIndex} de {totalItems} registros
        </span>
        <span className="sm:hidden">
          {startIndex}-{endIndex} de {totalItems}
        </span>
        
        {/* Page size selector */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">Por página:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-9 w-[70px] min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 min-h-[44px] min-w-[44px]"
          onClick={onFirstPage}
          disabled={!hasPrevPage}
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 min-h-[44px] min-w-[44px]"
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 px-2 sm:px-3 min-w-[80px] justify-center">
          <span className="text-sm font-medium">{currentPage}</span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 min-h-[44px] min-w-[44px]"
          onClick={onNextPage}
          disabled={!hasNextPage}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 min-h-[44px] min-w-[44px]"
          onClick={onLastPage}
          disabled={!hasNextPage}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default Pagination;

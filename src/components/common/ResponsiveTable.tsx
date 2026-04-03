import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  key: string;
  header: string;
  /** Priority: 1 = always visible, 2 = hidden on mobile, 3 = hidden on tablet */
  priority?: 1 | 2 | 3;
  render: (item: T) => ReactNode;
  /** Used as the card label on mobile */
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyState?: ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className,
  emptyState,
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // Mobile: card layout with priority-1 columns
  if (isMobile) {
    const visibleColumns = columns.filter((c) => !c.priority || c.priority === 1);
    const secondaryColumns = columns.filter((c) => c.priority === 2);

    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={cn(
              "card-base p-4 space-y-2",
              onRowClick && "cursor-pointer hover:border-primary/30 active:scale-[0.99] transition-all"
            )}
          >
            {visibleColumns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {col.mobileLabel || col.header}
                </span>
                <span className="text-sm font-medium text-foreground text-right">
                  {col.render(item)}
                </span>
              </div>
            ))}
            {secondaryColumns.length > 0 && (
              <div className="pt-2 mt-2 border-t border-border space-y-1.5">
                {secondaryColumns.map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {col.mobileLabel || col.header}
                    </span>
                    <span className="text-xs text-foreground text-right">
                      {col.render(item)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Desktop: standard table
  const visibleColumns = columns.filter((c) => !c.priority || c.priority <= 2);

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {visibleColumns.map((col) => (
              <TableHead key={col.key} className="text-xs font-semibold uppercase tracking-wider">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/30"
              )}
            >
              {visibleColumns.map((col) => (
                <TableCell key={col.key}>{col.render(item)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

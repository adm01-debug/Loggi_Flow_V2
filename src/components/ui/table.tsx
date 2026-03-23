import * as React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Check, Minus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Table container variants
const tableContainerVariants = cva(
  "relative w-full overflow-auto",
  {
    variants: {
      variant: {
        default: "",
        bordered: "border rounded-lg",
        striped: "",
        minimal: "",
      },
      rounded: {
        none: "",
        sm: "rounded-md",
        default: "rounded-lg",
        lg: "rounded-xl",
      }
    },
    defaultVariants: {
      variant: "default",
      rounded: "default",
    }
  }
);

interface TableProps 
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableContainerVariants> {
  stickyHeader?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, rounded, stickyHeader, ...props }, ref) => (
    <div className={cn(tableContainerVariants({ variant, rounded }))}>
      <table 
        ref={ref} 
        className={cn(
          "w-full caption-bottom text-sm",
          variant === "striped" && "[&_tbody_tr:nth-child(even)]:bg-muted/30",
          className
        )} 
        {...props} 
      />
    </div>
  ),
);
Table.displayName = "Table";

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky, ...props }, ref) => (
    <thead 
      ref={ref} 
      className={cn(
        "[&_tr]:border-b bg-muted/50",
        sticky && "sticky top-0 z-10 backdrop-blur-sm bg-background/95",
        className
      )} 
      {...props} 
    />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody 
      ref={ref} 
      className={cn(
        "[&_tr:last-child]:border-0",
        className
      )} 
      {...props} 
    />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot 
      ref={ref} 
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )} 
      {...props} 
    />
  ),
);
TableFooter.displayName = "TableFooter";

// Row variants
const tableRowVariants = cva(
  "border-b transition-all duration-200",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50 data-[state=selected]:bg-muted",
        interactive: cn(
          "hover:bg-muted/50 data-[state=selected]:bg-primary/10",
          "cursor-pointer hover:shadow-sm"
        ),
        success: "bg-success/5 hover:bg-success/10 border-success/20",
        warning: "bg-warning/5 hover:bg-warning/10 border-warning/20",
        danger: "bg-destructive/5 hover:bg-destructive/10 border-destructive/20",
        muted: "opacity-60 hover:opacity-100",
      },
      selected: {
        true: "bg-primary/5 border-primary/20",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      selected: false,
    }
  }
);

interface TableRowProps 
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, variant, selected, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(tableRowVariants({ variant, selected }), className)}
      data-state={selected ? "selected" : undefined}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

// Sortable header
type SortDirection = "asc" | "desc" | null;

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => {
    const SortIcon = sortDirection === "asc" 
      ? ArrowUp 
      : sortDirection === "desc" 
        ? ArrowDown 
        : ArrowUpDown;

    return (
      <th
        ref={ref}
        className={cn(
          "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
          "[&:has([role=checkbox])]:pr-0",
          sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
          sortable && "group",
          className,
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        {sortable ? (
          <div className="flex items-center gap-2">
            {children}
            <SortIcon 
              className={cn(
                "h-4 w-4 transition-all",
                sortDirection 
                  ? "opacity-100" 
                  : "opacity-0 group-hover:opacity-50"
              )} 
            />
          </div>
        ) : children}
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

// Cell variants
const tableCellVariants = cva(
  "p-4 align-middle [&:has([role=checkbox])]:pr-0",
  {
    variants: {
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      },
      highlight: {
        none: "",
        success: "text-emerald-600 dark:text-emerald-400 font-medium",
        warning: "text-amber-600 dark:text-amber-400 font-medium",
        danger: "text-red-600 dark:text-red-400 font-medium",
        primary: "text-primary font-medium",
      },
      truncate: {
        true: "max-w-[200px] truncate",
        false: "",
      }
    },
    defaultVariants: {
      align: "left",
      highlight: "none",
      truncate: false,
    }
  }
);

interface TableCellProps 
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'>,
    VariantProps<typeof tableCellVariants> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align, highlight, truncate, ...props }, ref) => (
    <td 
      ref={ref} 
      className={cn(tableCellVariants({ align, highlight, truncate }), className)} 
      {...props} 
    />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption 
      ref={ref} 
      className={cn("mt-4 text-sm text-muted-foreground", className)} 
      {...props} 
    />
  ),
);
TableCaption.displayName = "TableCaption";

// Checkbox cell for selection
interface TableCheckboxCellProps {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const TableCheckboxCell = ({ checked, onCheckedChange, disabled }: TableCheckboxCellProps) => (
  <TableCell className="w-[40px] pr-0">
    <button
      type="button"
      role="checkbox"
      aria-checked={checked === "indeterminate" ? "mixed" : checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "h-4 w-4 rounded border transition-all",
        "flex items-center justify-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked 
          ? "bg-primary border-primary text-primary-foreground" 
          : "border-input hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {checked === "indeterminate" ? (
        <Minus className="h-3 w-3" />
      ) : checked ? (
        <Check className="h-3 w-3" />
      ) : null}
    </button>
  </TableCell>
);

// Empty state row
interface TableEmptyRowProps {
  colSpan: number;
  message?: string;
  icon?: React.ReactNode;
}

const TableEmptyRow = ({ colSpan, message = "Nenhum dado encontrado", icon }: TableEmptyRowProps) => (
  <TableRow className="hover:bg-transparent">
    <TableCell colSpan={colSpan} className="h-32 text-center">
      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
        {icon}
        <span>{message}</span>
      </div>
    </TableCell>
  </TableRow>
);

// Loading row with skeleton
interface TableLoadingRowProps {
  colSpan: number;
  rows?: number;
}

const TableLoadingRow = ({ colSpan, rows = 3 }: TableLoadingRowProps) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i} className="hover:bg-transparent">
        {Array.from({ length: colSpan }).map((_, j) => (
          <TableCell key={j}>
            <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableCaption,
  TableCheckboxCell,
  TableEmptyRow,
  TableLoadingRow,
  type SortDirection,
};

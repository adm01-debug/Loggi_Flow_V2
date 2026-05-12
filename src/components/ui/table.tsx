import * as React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Check, Minus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

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
          "w-full caption-bottom text-[var(--density-font-size,0.875rem)]",
          variant === "striped" && "[&_tbody_tr:nth-child(even)]:bg-muted/30",
          className
        )} 
        {...props} 
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }>(
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
      className={cn("[&_tr:last-child]:border-0", className)} 
      {...props} 
    />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot 
      ref={ref} 
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} 
      {...props} 
    />
  ),
);
TableFooter.displayName = "TableFooter";

const tableRowVariants = cva(
  "border-b transition-all duration-200",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50 data-[state=selected]:bg-muted",
        interactive: "hover:bg-muted/50 data-[state=selected]:bg-primary/10 cursor-pointer hover:shadow-sm",
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

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & VariantProps<typeof tableRowVariants>>(
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

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean; sortDirection?: "asc" | "desc" | null; onSort?: () => void }>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => {
    const SortIcon = sortDirection === "asc" ? ArrowUp : sortDirection === "desc" ? ArrowDown : ArrowUpDown;
    return (
      <th
        ref={ref}
        className={cn(
          "h-10 px-[var(--table-padding,1rem)] text-left align-middle font-medium text-muted-foreground transition-all",
          sortable && "cursor-pointer select-none hover:text-foreground group",
          className,
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {sortable && <SortIcon className={cn("h-4 w-4 transition-all", sortDirection ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />}
        </div>
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td 
      ref={ref} 
      className={cn("p-[var(--table-padding,1rem)] align-middle transition-all", className)} 
      {...props} 
    />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { 
  Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption
};

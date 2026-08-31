import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
}

export function Skeleton({ className, shimmer = true, variant = 'default' }: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    text: 'rounded h-4'
  };

  return (
    <div
      className={cn(
        "relative bg-muted/60 overflow-hidden",
        variantClasses[variant],
        shimmer ? "after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-shimmer" : "animate-pulse",
        className
      )}
    />
  );
}

// Premium Skeleton with glow effect
export function SkeletonPremium({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-md overflow-hidden bg-muted", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/50 p-6 space-y-4 animate-in fade-in duration-300", className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/30">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border/50 overflow-hidden animate-in fade-in duration-300", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/30">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/30">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="p-4">
                  <Skeleton className={cn("h-4", j === 0 ? "w-32" : "w-full")} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/50 p-6 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function StatsGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-20 h-20" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 animate-in fade-in duration-300", className)}>
      <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  );
}

export function NotificationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/50 animate-in fade-in duration-300", className)}>
      <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 animate-in fade-in duration-300">
          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      <StatsGridSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="line" />
      </div>
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

export function ChartSkeleton({ type = 'bar', className }: { type?: 'bar' | 'line' | 'pie'; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/50 p-6 animate-in fade-in duration-300", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {type === 'bar' && (
        <div className="h-48 flex items-end gap-3 pt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1" style={{ height: `${30 + (i * 10) % 70}%` }}>
              <Skeleton className="w-full h-full rounded-t-md" />
            </div>
          ))}
        </div>
      )}

      {type === 'line' && (
        <div className="h-48 relative flex items-center justify-center">
           <div className="w-full h-px bg-muted absolute top-1/2" />
           <Skeleton className="h-32 w-full" />
        </div>
      )}

      {type === 'pie' && (
        <div className="h-48 flex items-center justify-center">
          <Skeleton variant="circular" className="w-40 h-40" />
        </div>
      )}

      <div className="flex gap-4 mt-4 pt-4 border-t border-border/30">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton variant="circular" className="w-3 h-3" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-500", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      
      <StatsGridSkeleton count={4} />
      
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-md rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      <CardGridSkeleton count={6} />
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton variant="circular" className="w-10 h-10" />
        </div>
      </div>
      
      <div className="space-y-6">
        <StatsGridSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton type="bar" />
          <ChartSkeleton type="line" />
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

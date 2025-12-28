import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rounded" | "card" | "text" | "avatar";
  animation?: "shimmer" | "pulse" | "wave";
  width?: string | number;
  height?: string | number;
}

function Skeleton({
  className,
  variant = "default",
  animation = "shimmer",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variants = {
    default: "rounded-md",
    circular: "rounded-full",
    rounded: "rounded-lg",
    card: "rounded-xl",
    text: "rounded h-4",
    avatar: "rounded-full w-10 h-10",
  };

  const animations = {
    shimmer: "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent overflow-hidden relative",
    pulse: "animate-pulse",
    wave: "animate-[wave_1.5s_ease-in-out_infinite]",
  };

  return (
    <div
      className={cn(
        "bg-muted/60",
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

// Pre-built skeleton compositions
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border-2 border-border/50 p-5 space-y-4 bg-card/50", className)}>
      <div className="flex items-start justify-between">
        <Skeleton variant="rounded" className="w-12 h-12" />
        <Skeleton className="w-16 h-6" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton variant="text" className="w-28" />
      </div>
    </div>
  );
}

function SkeletonKPICard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border-2 border-border/50 p-5 bg-gradient-to-br from-card via-card to-card-elevated", className)}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton variant="rounded" className="w-12 h-12" />
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-10 h-5" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-24 h-4" />
        <Skeleton className="h-10 w-20" />
        <Skeleton variant="text" className="w-32 h-3" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/30 p-4 flex gap-4 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div 
          key={rowIdx} 
          className="p-4 flex gap-4 border-b border-border/50 last:border-0"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border p-6 space-y-4", className)}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" className="w-16 h-16" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton variant="rounded" className="w-12 h-12" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPICard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonList items={4} />
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonKPICard, 
  SkeletonTable, 
  SkeletonList, 
  SkeletonChart,
  SkeletonProfile,
  SkeletonDashboard 
};
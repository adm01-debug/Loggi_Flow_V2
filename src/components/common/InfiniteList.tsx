import { ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteListProps<T> { items: T[]; renderItem: (item: T, index: number) => ReactNode; loadMoreRef: (node: HTMLDivElement | null) => void; isLoading: boolean; isFetchingMore: boolean; hasMore: boolean; emptyMessage?: string; className?: string; }

export function InfiniteList<T>({ items, renderItem, loadMoreRef, isLoading, isFetchingMore, hasMore, emptyMessage = 'Nenhum item encontrado', className }: InfiniteListProps<T>) {
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (items.length === 0) return <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>;

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => renderItem(item, index))}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isFetchingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {!hasMore && items.length > 10 && <span className="text-sm text-muted-foreground">Fim da lista</span>}
      </div>
    </div>
  );
}

interface VirtualListProps<T> extends Omit<InfiniteListProps<T>, 'loadMoreRef'> { itemHeight: number; containerHeight: number; }

export function VirtualList<T>({ items, renderItem, isLoading, itemHeight, containerHeight, emptyMessage, className }: VirtualListProps<T>) {
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (items.length === 0) return <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>;

  return (
    <div className={cn("overflow-auto", className)} style={{ height: containerHeight }}>
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {items.map((item, index) => (
          <div key={index} style={{ position: 'absolute', top: index * itemHeight, height: itemHeight, width: '100%' }}>{renderItem(item, index)}</div>
        ))}
      </div>
    </div>
  );
}

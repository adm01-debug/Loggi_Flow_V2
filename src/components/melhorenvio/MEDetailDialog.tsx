import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MEDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Record<string, unknown> | null;
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof value === 'boolean') return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Sim' : 'Não'}</Badge>;
  if (typeof value === 'number') return <span className="font-mono">{value}</span>;
  if (typeof value === 'string') {
    if (value.startsWith('http')) return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{value}</a>;
    return <span className="break-words">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">Lista vazia</span>;
    return (
      <div className="space-y-2 pl-3 border-l-2 border-border">
        {value.map((item, i) => (
          <div key={i}>{renderValue(item, depth + 1)}</div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className={depth > 0 ? "space-y-1 pl-3 border-l-2 border-border" : "space-y-2"}>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
            <div className="text-sm">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

export function MEDetailDialog({ open, onOpenChange, title, data }: MEDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Separator />
        {data ? (
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="text-sm">{renderValue(value)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

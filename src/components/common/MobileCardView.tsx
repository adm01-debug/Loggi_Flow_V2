import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileCardField {
  label: string;
  value: ReactNode;
  className?: string;
}

interface MobileCardViewProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => { title: string; subtitle?: string; badge?: ReactNode; fields: MobileCardField[]; actions?: ReactNode };
  className?: string;
  emptyMessage?: string;
}

/**
 * Mobile-friendly card view alternative to DataTable.
 * Shows on screens < 768px width.
 */
export function MobileCardView<T extends { id?: string }>({ data, renderCard, className, emptyMessage = "Nenhum item encontrado" }: MobileCardViewProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center py-8">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const card = renderCard(item, index);
        return (
          <div key={(item as any).id || index} className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm truncate">{card.title}</h3>
                {card.subtitle && <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>}
              </div>
              {card.badge}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {card.fields.map((field, i) => (
                <div key={i} className={cn("space-y-0.5", field.className)}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{field.label}</p>
                  <div className="text-sm">{field.value}</div>
                </div>
              ))}
            </div>

            {card.actions && (
              <div className="flex items-center gap-2 pt-2 border-t">
                {card.actions}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

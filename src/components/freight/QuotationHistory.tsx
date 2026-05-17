import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, Package, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import type { QuotationResult } from '@/hooks/useFreightQuotation';
import type { CargoData } from '@/hooks/useQuotationFlow';

interface HistoryEntry {
  data: CargoData;
  results: QuotationResult[];
  date: string;
}

interface QuotationHistoryProps {
  history: HistoryEntry[];
  onReuse: (data: CargoData) => Promise<void>;
}

export function QuotationHistory({ history, onReuse }: QuotationHistoryProps) {
  if (history.length === 0) {
    return <EmptyState icon={Clock} title="Sem histórico" description="Suas cotações anteriores aparecerão aqui" />;
  }

  return (
    <div className="space-y-3">
      {history.slice(0, 10).map((entry, i) => {
        const best = entry.results[0];
        return (
          <div key={i} className="card-interactive flex items-center gap-4">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1"><MapPin className="w-3 h-3" />{entry.data.estado_destino}</Badge>
                <Badge variant="secondary" className="gap-1"><Package className="w-3 h-3" />{entry.data.peso_kg}kg</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.date), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {best && (
                <p className="text-sm text-muted-foreground mt-1">
                  Melhor: {best.transportadora_nome} — R$ {best.valor_total?.toFixed(2)}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-muted-foreground">{entry.results.length} opções</p>
            </div>
            <Button variant="ghost" size="sm" onClick={async () => await onReuse(entry.data)}>
              <RotateCcw className="w-4 h-4 mr-1" />Recotar
            </Button>
          </div>
        );
      })}
    </div>
  );
}

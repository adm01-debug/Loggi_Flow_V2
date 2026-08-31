import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataExporter } from '@/components/common/DataExporter';
import { Clock, DollarSign, ShoppingCart } from 'lucide-react';
import type { MEQuotationResult } from './types';

interface MEQuoteResultsProps {
  results: MEQuotationResult[];
  onClearHistory: () => void;
  onOpenCartDialog: (result: MEQuotationResult) => void;
}

export function MEQuoteResults({ results, onClearHistory, onOpenCartDialog }: MEQuoteResultsProps) {
  if (results.length === 0) return null;

  const bestPrice = Math.min(...results.map((r) => parseFloat(r.custom_price || r.price || '999999')));
  const bestDeadline = Math.min(...results.map((r) => r.delivery_time || 999));

  const exportData = results.map(r => ({
    name: `${r.company?.name || ''} - ${r.name}`,
    price: `R$ ${parseFloat(r.custom_price || r.price || '0').toFixed(2)}`,
    delivery_time: r.delivery_time || '-',
    discount: r.discount ? `R$ ${r.discount}` : '-',
  }));

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{results.length} resultado(s) — histórico salvo localmente</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClearHistory}>Limpar histórico</Button>
          <DataExporter data={exportData} filename="cotacoes-melhor-envio" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((r, i) => {
          const price = parseFloat(r.custom_price || r.price || '0');
          const isBestPrice = price === bestPrice;
          const isBestDeadline = r.delivery_time === bestDeadline;

          return (
            <Card key={i} className={isBestPrice ? 'border-primary ring-1 ring-primary/30' : ''}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{r.company?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{r.name || 'N/A'}</p>
                  </div>
                  <div className="flex gap-1">
                    {isBestPrice && <Badge variant="default" className="text-xs"><DollarSign className="w-3 h-3 mr-1" />Menor preço</Badge>}
                    {isBestDeadline && <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Mais rápido</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Preço:</span>
                    <span className="ml-1 font-bold text-primary">R$ {price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prazo:</span>
                    <span className="ml-1 font-semibold">{r.delivery_time || '-'} dias</span>
                  </div>
                  {r.discount && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="ml-1 text-accent-foreground">R$ {r.discount}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenCartDialog(r)}>
                  <ShoppingCart className="w-4 h-4 mr-1" /> Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

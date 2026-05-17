import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Search, Loader2, Star, Clock } from 'lucide-react';
import { useFreightQuotation, QuotationResult } from '@/hooks/useFreightQuotation';
import { toast } from 'sonner';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function QuickQuoteWidget() {
  const { calculateQuotations } = useFreightQuotation();
  const [uf, setUf] = useState('');
  const [peso, setPeso] = useState('');
  const [results, setResults] = useState<QuotationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleQuote = useCallback(async () => {
    if (!uf || !peso) { toast.error('Preencha UF e peso'); return; }
    setLoading(true);
    const r = await calculateQuotations?.({ estado_destino: uf, peso_kg: parseFloat(peso) });
    setResults((r || []).slice(0, 3));
    setLoading(false);
  }, [uf, peso, calculateQuotations]);

  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-warning" />
        <span className="font-semibold text-sm">Cotação Rápida</span>
      </div>
      <div className="flex gap-2">
        <Select value={uf} onValueChange={setUf}>
          <SelectTrigger className="w-20 h-9"><SelectValue placeholder="UF" /></SelectTrigger>
          <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
        </Select>
        <Input className="w-24 h-9" type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="kg" />
        <Button size="sm" onClick={handleQuote} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-1">
                {i === 0 && <Star className="w-3 h-3 text-warning" />}
                <span className="truncate max-w-[120px]">{r.transportadora_nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" />{r.prazo_dias}d</span>
                <span className="font-bold text-primary">R${r.valor_total.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

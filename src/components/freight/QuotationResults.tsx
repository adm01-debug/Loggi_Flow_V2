import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Package, TrendingDown, Award } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { type QuotationResult } from '@/hooks/useFreightQuotation';
import { motion, AnimatePresence } from 'framer-motion';

interface QuotationResultsProps {
  results: QuotationResult[];
  hasSearched: boolean;
  onSelect?: (result: QuotationResult) => void;
}

export function QuotationResults({ results, hasSearched, onSelect }: QuotationResultsProps) {
  const savings = useMemo(() => {
    if (results.length < 2) return 0;
    const max = Math.max(...results.map(r => r.valor_total));
    const min = Math.min(...results.map(r => r.valor_total));
    return max - min;
  }, [results]);

  if (!hasSearched) return null;

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhuma cotação encontrada"
        description="Tente ajustar o estado ou faixa de peso para encontrar tabelas de frete compatíveis"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Savings Banner */}
      {savings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-success/20 to-success/5 border-2 border-success/30 shadow-lg shadow-success/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/20">
              <TrendingDown className="w-6 h-6 text-success animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-success">Oportunidade de Lucro</p>
              <p className="text-xl font-black italic tracking-tighter">
                Economia de <span className="text-success text-2xl">R$ {savings.toFixed(2)}</span> identificada
              </p>
            </div>
          </div>
          <Badge className="bg-success text-white px-4 py-1 rounded-full animate-pulse">Custo Reduzido</Badge>
        </motion.div>
      )}

      <AnimatePresence>
        {results.map((r, i) => (
          <motion.div
            key={`${r.transportadora_id}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "card-interactive flex items-center gap-4",
              i === 0 && "ring-1 ring-success/30 bg-success/5"
            )}
          >
            <div className={cn(
              "p-3 rounded-lg",
              i === 0 ? "bg-warning/15" : "bg-muted"
            )}>
              {i === 0 ? <Star className="w-5 h-5 text-warning" /> : <Package className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{r.transportadora_nome}</p>
                {r.melhor_preco && <Badge className="bg-success/10 text-success border-success/20 text-xs">Menor Preço</Badge>}
                {r.melhor_prazo && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Mais Rápido</Badge>}
                {r.melhor_custo_beneficio && <Badge className="bg-warning/10 text-warning border-warning/20 text-xs gap-1"><Award className="w-3 h-3" />Custo-Benefício</Badge>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.prazo_dias} dias</span>
                <span>R$ {r.preco_por_kg?.toFixed(2)}/kg</span>
                <span className="text-xs">Taxa fixa: R$ {r.taxa_fixa?.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-primary">R$ {r.valor_total?.toFixed(2)}</p>
            </div>
            <Button size="sm" onClick={() => onSelect?.(r)}>Selecionar</Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

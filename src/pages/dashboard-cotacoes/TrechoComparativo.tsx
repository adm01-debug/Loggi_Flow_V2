import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CotacaoMulticanal } from '@/hooks';

function CanalBadge({ canal }: { canal: string }) {
  switch (canal) {
    case 'api': return <Badge className="bg-success/10 text-success border-success/20 gap-1">API</Badge>;
    case 'whatsapp': return <Badge className="bg-success/10 text-success border-success/20 gap-1">WhatsApp</Badge>;
    case 'email': return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">Email</Badge>;
    default: return null;
  }
}

interface TrechoComparativoProps {
  trechoGroups: Record<string, CotacaoMulticanal[]>;
  onSelect: (id: string) => void;
}

export function TrechoComparativo({ trechoGroups, onSelect }: TrechoComparativoProps) {
  if (Object.keys(trechoGroups).length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="w-5 h-5 text-warning" />
          Comparativo por Trecho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(trechoGroups).map(([trecho, group]) => {
          const sorted = [...group].sort((a, b) => (a.valor_cotado || Infinity) - (b.valor_cotado || Infinity));

          return (
            <div key={trecho} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="font-mono">{trecho.replace('-', ' → ')}</Badge>
                <span className="text-xs text-muted-foreground">{group.length} cotação(ões)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sorted.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3 rounded-lg border ${i === 0 ? 'border-success/30 bg-success/5' : 'bg-card'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{c.transportadora?.nome_fantasia}</span>
                      {i === 0 && <Badge className="bg-success text-xs">Melhor</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">R$ {c.valor_cotado?.toFixed(2)}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />{c.prazo_dias || '?'}d
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <CanalBadge canal={c.canal} />
                      {c.status !== 'selecionado' && i === 0 && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSelect(c.id)}>
                          Selecionar
                        </Button>
                      )}
                      {c.status === 'selecionado' && (
                        <Badge className="bg-primary/10 text-primary gap-1"><Award className="w-3 h-3" />Selecionado</Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatsCard } from '@/components/common/StatsCard';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ArrowLeftRight, CheckCircle2, AlertTriangle, XCircle, Clock,
  Wand2, FileSpreadsheet, Loader2, DollarSign, Truck, Package,
  RefreshCw, Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface FaturaItem {
  id: string;
  transportadora_nome: string;
  numero_nf: string;
  valor_fatura: number;
  data_fatura: string;
}

interface MatchResult {
  fatura: FaturaItem;
  entrega_id: string | null;
  numero_entrega: string | null;
  valor_sistema: number | null;
  diferenca: number;
  status: 'conciliado' | 'divergencia' | 'sem_match';
}

export default function ConciliacaoAutomatica() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showResults, setShowResults] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: entregas } = useQuery({
    queryKey: ['conciliacao-entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id, numero_entrega, valor_frete, nf_remessa, status,
          transportadora:transportadoras (nome_fantasia)
        `)
        .not('valor_frete', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: itensImportados } = useQuery({
    queryKey: ['conciliacao-itens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conciliacao_itens_importados')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const runAutoMatch = async () => {
    if (!entregas || !itensImportados) return;
    setIsProcessing(true);

    try {
      const results: MatchResult[] = [];

      for (const item of itensImportados) {
        const fatura: FaturaItem = {
          id: item.id,
          transportadora_nome: item.transportadora_nome || '',
          numero_nf: item.referencia_externa || '',
          valor_fatura: item.valor,
          data_fatura: item.data_documento || item.created_at,
        };

        // Try to match by NF number
        let matchedEntrega = entregas.find(
          e => e.nf_remessa && item.referencia_externa && 
               e.nf_remessa.trim() === item.referencia_externa.trim()
        );

        // Try to match by value + transportadora
        if (!matchedEntrega) {
          const transportadoraNome = (item.transportadora_nome || '').toLowerCase().substring(0, 5);
          matchedEntrega = entregas.find(
            e => {
              const entregaTransp = e.transportadora as { nome_fantasia: string } | null;
              return e.valor_frete && Math.abs(e.valor_frete - item.valor) < 0.01 &&
                entregaTransp?.nome_fantasia?.toLowerCase().includes(transportadoraNome);
            }
          );
        }

        if (matchedEntrega) {
          const diferenca = Math.abs((matchedEntrega.valor_frete || 0) - item.valor);
          const tolerancia = item.valor * 0.02; // 2% tolerance
          results.push({
            fatura,
            entrega_id: matchedEntrega.id,
            numero_entrega: matchedEntrega.numero_entrega,
            valor_sistema: matchedEntrega.valor_frete,
            diferenca,
            status: diferenca <= tolerancia ? 'conciliado' : 'divergencia',
          });
        } else {
          results.push({
            fatura,
            entrega_id: null,
            numero_entrega: null,
            valor_sistema: null,
            diferenca: item.valor,
            status: 'sem_match',
          });
        }
      }

      setMatchResults(results);
      setShowResults(true);

      const conciliados = results.filter(r => r.status === 'conciliado').length;
      const divergencias = results.filter(r => r.status === 'divergencia').length;
      const semMatch = results.filter(r => r.status === 'sem_match').length;

      toast.success(
        `Conciliação concluída: ${conciliados} OK, ${divergencias} divergências, ${semMatch} sem match`
      );
    } catch (err) {
      toast.error('Erro na conciliação automática');
    } finally {
      setIsProcessing(false);
    }
  };

  const conciliados = matchResults.filter(r => r.status === 'conciliado');
  const divergencias = matchResults.filter(r => r.status === 'divergencia');
  const semMatch = matchResults.filter(r => r.status === 'sem_match');
  const valorDivergencia = divergencias.reduce((s, r) => s + r.diferenca, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <ArrowLeftRight className="w-6 h-6 text-primary" />
              </div>
              Conciliação Automática
            </h1>
            <p className="text-muted-foreground mt-1">
              Cruzamento automático de faturas com entregas do sistema
            </p>
          </div>
          <Button onClick={runAutoMatch} disabled={isProcessing || !itensImportados?.length} className="gap-2">
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Processando...</>
            ) : (
              <><Wand2 className="w-4 h-4" />Executar Conciliação</>
            )}
          </Button>
        </div>

        {/* KPIs */}
        {showResults && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Conciliados" value={conciliados.length} icon={CheckCircle2} color="success" />
            <StatsCard title="Divergências" value={divergencias.length} icon={AlertTriangle} color="warning" />
            <StatsCard title="Sem Match" value={semMatch.length} icon={XCircle} color="destructive" />
            <StatsCard title="Valor Divergência" value={`R$ ${valorDivergencia.toFixed(2)}`} icon={DollarSign} color="info" />
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{entregas?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Entregas com frete cadastrado</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <FileSpreadsheet className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{itensImportados?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Itens importados para conciliar</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {showResults && matchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-5 h-5" />
                Resultado da Conciliação ({matchResults.length} itens)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Transportadora</TableHead>
                      <TableHead>NF/Ref</TableHead>
                      <TableHead className="text-right">Valor Fatura</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead className="text-right">Valor Sistema</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {r.status === 'conciliado' && <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1"><CheckCircle2 className="w-3 h-3" />OK</Badge>}
                          {r.status === 'divergencia' && <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1"><AlertTriangle className="w-3 h-3" />Diverg.</Badge>}
                          {r.status === 'sem_match' && <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Sem Match</Badge>}
                        </TableCell>
                        <TableCell className="font-medium">{r.fatura.transportadora_nome || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{r.fatura.numero_nf || '—'}</TableCell>
                        <TableCell className="text-right">R$ {r.fatura.valor_fatura.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.numero_entrega || '—'}</TableCell>
                        <TableCell className="text-right">{r.valor_sistema ? `R$ ${r.valor_sistema.toFixed(2)}` : '—'}</TableCell>
                        <TableCell className={cn("text-right font-medium", r.diferenca > 0.01 ? 'text-destructive' : 'text-green-600')}>
                          R$ {r.diferenca.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {!showResults && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <EmptyState
                icon={ArrowLeftRight}
                title="Pronto para conciliar"
                description="Importe itens na página Conciliação Financeira e clique em 'Executar Conciliação' para cruzar automaticamente com as entregas"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

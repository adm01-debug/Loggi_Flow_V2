import { useCotacoesFrete } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/common/EmptyState';

export function CotacoesFreteManager() {
  const { cotacoes, isLoading, selectCotacao, deleteCotacao } = useCotacoesFrete();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cotacoes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma cotação salva"
        description="As cotações salvas ao selecionar resultados aparecerão aqui"
      />
    );
  }

  // Group by entrega
  const grouped = cotacoes.reduce<Record<string, typeof cotacoes>>((acc, c) => {
    const key = c.entrega_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([entregaId, items]) => {
        const entregaInfo = items[0]?.entrega;
        return (
          <Card key={entregaId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Entrega: {entregaInfo?.numero_entrega || entregaId.slice(0, 8)}
                {entregaInfo?.endereco_entrega && (
                  <span className="text-muted-foreground font-normal text-xs">
                    — {entregaInfo.endereco_entrega}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.transportadora?.nome_fantasia || 'N/A'}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        R$ {c.valor.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {c.prazo_dias ? `${c.prazo_dias} dias` : '-'}
                      </TableCell>
                      <TableCell>
                        {c.selecionada ? (
                          <Badge className="bg-success/10 text-success border-success/20 gap-1">
                            <CheckCircle className="w-3 h-3" /> Selecionada
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(c.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {!c.selecionada && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectCotacao.mutate({ id: c.id, entregaId: c.entrega_id })}
                            disabled={selectCotacao.isPending}
                          >
                            Selecionar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteCotacao.mutate(c.id)}
                          disabled={deleteCotacao.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { ShoppingCart, Trash2, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';

export function MECarrinhoPanel() {
  const { listarCarrinho, removerItemCarrinho, comprarFretes } = useMelhorEnvio();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const items = Array.isArray(listarCarrinho.data?.data) ? listarCarrinho.data.data : 
                Array.isArray(listarCarrinho.data) ? listarCarrinho.data : [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item: any) => item.id));
    }
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) return;
    comprarFretes.mutate(selectedIds);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Carrinho de Fretes
          {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => listarCarrinho.refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          {selectedIds.length > 0 && (
            <Button size="sm" onClick={handleCheckout} disabled={comprarFretes.isPending}>
              {comprarFretes.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CreditCard className="w-4 h-4 mr-1" />}
              Comprar ({selectedIds.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {listarCarrinho.isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={selectedIds.length === items.length && items.length > 0} onChange={selectAll} />
                </TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{item.service || '-'}</TableCell>
                  <TableCell>{item.company?.name || '-'}</TableCell>
                  <TableCell className="text-xs">{item.to?.postal_code || '-'}</TableCell>
                  <TableCell className="font-semibold text-primary">R$ {item.price || '-'}</TableCell>
                  <TableCell>{item.delivery_time || '-'} dias</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removerItemCarrinho.mutate(item.id)} disabled={removerItemCarrinho.isPending}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

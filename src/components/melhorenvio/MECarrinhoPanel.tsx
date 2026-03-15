import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { ShoppingCart, Trash2, CreditCard, Loader2, RefreshCw, RotateCcw, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MECartItem } from './types';

export function MECarrinhoPanel() {
  const { listarCarrinho, removerItemCarrinho, comprarFretes, inserirLogisticaReversa, exibirItemCarrinho } = useMelhorEnvio();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showReverse, setShowReverse] = useState(false);
  const [itemDetail, setItemDetail] = useState<Record<string, unknown> | null>(null);

  const [reverseForm, setReverseForm] = useState({
    service: '',
    from_name: '',
    from_postal_code: '',
    from_address: '',
    from_number: '',
    from_district: '',
    from_city: '',
    from_state_abbr: '',
    to_name: '',
    to_postal_code: '',
    to_address: '',
    to_number: '',
    to_district: '',
    to_city: '',
    to_state_abbr: '',
    width: '20',
    height: '10',
    length: '30',
    weight: '1',
    insurance_value: '100',
  });

  const rawData = listarCarrinho.data;
  const items: MECartItem[] = Array.isArray((rawData as Record<string, unknown>)?.data)
    ? (rawData as Record<string, unknown>).data as MECartItem[]
    : Array.isArray(rawData)
      ? rawData as MECartItem[]
      : [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.id));
    }
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) return;
    comprarFretes.mutate(selectedIds);
  };

  const handleViewItem = (id: string) => {
    exibirItemCarrinho.mutate(id, {
      onSuccess: (data) => setItemDetail(data as Record<string, unknown>),
    });
  };

  const handleReverseSubmit = () => {
    inserirLogisticaReversa.mutate({
      service: parseInt(reverseForm.service),
      from: {
        name: reverseForm.from_name,
        postal_code: reverseForm.from_postal_code,
        address: reverseForm.from_address,
        number: reverseForm.from_number,
        district: reverseForm.from_district,
        city: reverseForm.from_city,
        state_abbr: reverseForm.from_state_abbr,
      },
      to: {
        name: reverseForm.to_name,
        postal_code: reverseForm.to_postal_code,
        address: reverseForm.to_address,
        number: reverseForm.to_number,
        district: reverseForm.to_district,
        city: reverseForm.to_city,
        state_abbr: reverseForm.to_state_abbr,
      },
      products: [{
        width: parseFloat(reverseForm.width),
        height: parseFloat(reverseForm.height),
        length: parseFloat(reverseForm.length),
        weight: parseFloat(reverseForm.weight),
        insurance_value: parseFloat(reverseForm.insurance_value),
        quantity: 1,
      }],
    } as Record<string, unknown>, {
      onSuccess: () => setShowReverse(false),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Carrinho de Fretes
            {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowReverse(true)}>
              <RotateCcw className="w-4 h-4 mr-1" /> Logística Reversa
            </Button>
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
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
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
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewItem(item.id)} disabled={exibirItemCarrinho.isPending}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removerItemCarrinho.mutate(item.id)} disabled={removerItemCarrinho.isPending}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {itemDetail && (
        <Dialog open={!!itemDetail} onOpenChange={() => setItemDetail(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
            <DialogHeader><DialogTitle>Detalhes do Item</DialogTitle></DialogHeader>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto">{JSON.stringify(itemDetail, null, 2)}</pre>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showReverse} onOpenChange={setShowReverse}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Logística Reversa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID do Serviço *</Label>
              <Input placeholder="Ex: 2 (SEDEX)" value={reverseForm.service} onChange={(e) => setReverseForm(p => ({ ...p, service: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">Origem (quem envia de volta)</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={reverseForm.from_name} onChange={(e) => setReverseForm(p => ({ ...p, from_name: e.target.value }))} /></div>
                <div><Label>CEP</Label><Input value={reverseForm.from_postal_code} onChange={(e) => setReverseForm(p => ({ ...p, from_postal_code: e.target.value }))} /></div>
                <div className="col-span-2"><Label>Endereço</Label><Input value={reverseForm.from_address} onChange={(e) => setReverseForm(p => ({ ...p, from_address: e.target.value }))} /></div>
                <div><Label>Número</Label><Input value={reverseForm.from_number} onChange={(e) => setReverseForm(p => ({ ...p, from_number: e.target.value }))} /></div>
                <div><Label>Bairro</Label><Input value={reverseForm.from_district} onChange={(e) => setReverseForm(p => ({ ...p, from_district: e.target.value }))} /></div>
                <div><Label>Cidade</Label><Input value={reverseForm.from_city} onChange={(e) => setReverseForm(p => ({ ...p, from_city: e.target.value }))} /></div>
                <div><Label>UF</Label><Input value={reverseForm.from_state_abbr} onChange={(e) => setReverseForm(p => ({ ...p, from_state_abbr: e.target.value }))} maxLength={2} /></div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">Destino (quem recebe de volta)</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={reverseForm.to_name} onChange={(e) => setReverseForm(p => ({ ...p, to_name: e.target.value }))} /></div>
                <div><Label>CEP</Label><Input value={reverseForm.to_postal_code} onChange={(e) => setReverseForm(p => ({ ...p, to_postal_code: e.target.value }))} /></div>
                <div className="col-span-2"><Label>Endereço</Label><Input value={reverseForm.to_address} onChange={(e) => setReverseForm(p => ({ ...p, to_address: e.target.value }))} /></div>
                <div><Label>Número</Label><Input value={reverseForm.to_number} onChange={(e) => setReverseForm(p => ({ ...p, to_number: e.target.value }))} /></div>
                <div><Label>Bairro</Label><Input value={reverseForm.to_district} onChange={(e) => setReverseForm(p => ({ ...p, to_district: e.target.value }))} /></div>
                <div><Label>Cidade</Label><Input value={reverseForm.to_city} onChange={(e) => setReverseForm(p => ({ ...p, to_city: e.target.value }))} /></div>
                <div><Label>UF</Label><Input value={reverseForm.to_state_abbr} onChange={(e) => setReverseForm(p => ({ ...p, to_state_abbr: e.target.value }))} maxLength={2} /></div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">Volume</p>
              <div className="grid grid-cols-5 gap-2">
                <div><Label className="text-xs">Larg. (cm)</Label><Input type="number" value={reverseForm.width} onChange={(e) => setReverseForm(p => ({ ...p, width: e.target.value }))} /></div>
                <div><Label className="text-xs">Alt. (cm)</Label><Input type="number" value={reverseForm.height} onChange={(e) => setReverseForm(p => ({ ...p, height: e.target.value }))} /></div>
                <div><Label className="text-xs">Comp. (cm)</Label><Input type="number" value={reverseForm.length} onChange={(e) => setReverseForm(p => ({ ...p, length: e.target.value }))} /></div>
                <div><Label className="text-xs">Peso (kg)</Label><Input type="number" value={reverseForm.weight} onChange={(e) => setReverseForm(p => ({ ...p, weight: e.target.value }))} /></div>
                <div><Label className="text-xs">Valor (R$)</Label><Input type="number" value={reverseForm.insurance_value} onChange={(e) => setReverseForm(p => ({ ...p, insurance_value: e.target.value }))} /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReverse(false)}>Cancelar</Button>
            <Button onClick={handleReverseSubmit} disabled={inserirLogisticaReversa.isPending || !reverseForm.service}>
              {inserirLogisticaReversa.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
              Inserir Logística Reversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

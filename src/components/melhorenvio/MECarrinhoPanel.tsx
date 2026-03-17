import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { ShoppingCart, Trash2, CreditCard, Loader2, RefreshCw, RotateCcw, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/skeletons';
import { MEDetailDialog } from './MEDetailDialog';
import { MEErrorState } from './MEErrorState';
import { MECepAutoFill } from './MECepAutoFill';
import { MEFormField } from './MEFormField';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/common/Pagination';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { formatPhone, formatCPFCNPJ } from '@/lib/validations';
import type { MECartItem } from './types';

export function MECarrinhoPanel() {
  const { listarCarrinho, removerItemCarrinho, comprarFretes, inserirLogisticaReversa, exibirItemCarrinho } = useMelhorEnvio();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showReverse, setShowReverse] = useState(false);
  const [itemDetail, setItemDetail] = useState<Record<string, unknown> | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [reverseSubmitted, setReverseSubmitted] = useState(false);
  const [reverseErrors, setReverseErrors] = useState<Record<string, string>>({});

  const [reverseForm, setReverseForm] = useState({
    service: '',
    from_name: '', from_phone: '', from_document: '', from_postal_code: '', from_address: '', from_number: '',
    from_district: '', from_city: '', from_state_abbr: '',
    to_name: '', to_phone: '', to_document: '', to_postal_code: '', to_address: '', to_number: '',
    to_district: '', to_city: '', to_state_abbr: '',
    width: '20', height: '10', length: '30', weight: '1', insurance_value: '100',
  });

  const rawData = listarCarrinho.data;
  const items: MECartItem[] = Array.isArray((rawData as Record<string, unknown>)?.data)
    ? (rawData as Record<string, unknown>).data as MECartItem[]
    : Array.isArray(rawData) ? rawData as MECartItem[] : [];

  const pagination = usePagination(items, { initialPageSize: 10 });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.length === items.length ? [] : items.map((item) => item.id));
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

  const validateReverseForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!reverseForm.service.trim()) errors['service'] = 'ID do serviço é obrigatório';
    if (!reverseForm.from_name.trim()) errors['from_name'] = 'Nome é obrigatório';
    if (!reverseForm.from_postal_code.replace(/\D/g, '').trim()) errors['from_postal_code'] = 'CEP é obrigatório';
    if (!reverseForm.from_address.trim()) errors['from_address'] = 'Endereço é obrigatório';
    if (!reverseForm.from_number.trim()) errors['from_number'] = 'Número é obrigatório';
    if (!reverseForm.from_district.trim()) errors['from_district'] = 'Bairro é obrigatório';
    if (!reverseForm.from_city.trim()) errors['from_city'] = 'Cidade é obrigatória';
    if (!reverseForm.from_state_abbr.trim()) errors['from_state'] = 'UF é obrigatória';
    if (!reverseForm.to_name.trim()) errors['to_name'] = 'Nome é obrigatório';
    if (!reverseForm.to_postal_code.replace(/\D/g, '').trim()) errors['to_postal_code'] = 'CEP é obrigatório';
    if (!reverseForm.to_address.trim()) errors['to_address'] = 'Endereço é obrigatório';
    if (!reverseForm.to_number.trim()) errors['to_number'] = 'Número é obrigatório';
    if (!reverseForm.to_district.trim()) errors['to_district'] = 'Bairro é obrigatório';
    if (!reverseForm.to_city.trim()) errors['to_city'] = 'Cidade é obrigatória';
    if (!reverseForm.to_state_abbr.trim()) errors['to_state'] = 'UF é obrigatória';
    setReverseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReverseSubmit = () => {
    setReverseSubmitted(true);
    if (!validateReverseForm()) return;
    inserirLogisticaReversa.mutate({
      service: parseInt(reverseForm.service),
      from: {
        name: reverseForm.from_name,
        postal_code: reverseForm.from_postal_code.replace(/\D/g, ''),
        address: reverseForm.from_address,
        number: reverseForm.from_number,
        district: reverseForm.from_district,
        city: reverseForm.from_city,
        state_abbr: reverseForm.from_state_abbr,
      },
      to: {
        name: reverseForm.to_name,
        postal_code: reverseForm.to_postal_code.replace(/\D/g, ''),
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
      onSuccess: () => { setShowReverse(false); setReverseSubmitted(false); },
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
            <TableSkeleton rows={3} columns={7} />
          ) : listarCarrinho.isError ? (
            <MEErrorState message="Erro ao carregar o carrinho." onRetry={() => listarCarrinho.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              variant="inbox"
              title="Carrinho vazio"
              description="Faça uma cotação e adicione fretes ao carrinho para começar."
              size="sm"
            />
          ) : (
            <>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={selectedIds.length === items.length && items.length > 0} onCheckedChange={selectAll} />
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
                    {pagination.paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
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
                            <Button variant="ghost" size="icon" onClick={() => setConfirmRemoveId(item.id)} disabled={removerItemCarrinho.isPending}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                pageSizeOptions={pagination.pageSizeOptions}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                onNextPage={pagination.nextPage}
                onPrevPage={pagination.prevPage}
                onFirstPage={pagination.firstPage}
                onLastPage={pagination.lastPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmRemoveId}
        onOpenChange={(open) => { if (!open) setConfirmRemoveId(null); }}
        title="Remover item do carrinho"
        description="Tem certeza que deseja remover este item do carrinho? Esta ação não pode ser desfeita."
        confirmText="Remover"
        type="danger"
        onConfirm={() => {
          if (confirmRemoveId) {
            removerItemCarrinho.mutate(confirmRemoveId);
            setConfirmRemoveId(null);
          }
        }}
      />

      <MEDetailDialog
        open={!!itemDetail}
        onOpenChange={() => setItemDetail(null)}
        title="Detalhes do Item"
        data={itemDetail}
      />

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
                <MECepAutoFill
                  value={reverseForm.from_postal_code}
                  onChange={(v) => setReverseForm(p => ({ ...p, from_postal_code: v }))}
                  label="CEP"
                  onAddressFound={(addr) => {
                    setReverseForm(p => ({
                      ...p,
                      from_address: addr.rua || p.from_address,
                      from_district: addr.bairro || p.from_district,
                      from_city: addr.cidade || p.from_city,
                      from_state_abbr: addr.uf || p.from_state_abbr,
                    }));
                  }}
                />
                <div className="col-span-2"><Label>Endereço</Label><Input value={reverseForm.from_address} onChange={(e) => setReverseForm(p => ({ ...p, from_address: e.target.value }))} /></div>
                <div><Label>Número</Label><Input value={reverseForm.from_number} onChange={(e) => setReverseForm(p => ({ ...p, from_number: e.target.value }))} /></div>
                <div><Label>Bairro</Label><Input value={reverseForm.from_district} onChange={(e) => setReverseForm(p => ({ ...p, from_district: e.target.value }))} /></div>
                <div><Label>Cidade</Label><Input value={reverseForm.from_city} onChange={(e) => setReverseForm(p => ({ ...p, from_city: e.target.value }))} /></div>
                <div><Label>UF</Label><Input value={reverseForm.from_state_abbr} onChange={(e) => setReverseForm(p => ({ ...p, from_state_abbr: e.target.value.toUpperCase() }))} maxLength={2} /></div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">Destino (quem recebe de volta)</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={reverseForm.to_name} onChange={(e) => setReverseForm(p => ({ ...p, to_name: e.target.value }))} /></div>
                <MECepAutoFill
                  value={reverseForm.to_postal_code}
                  onChange={(v) => setReverseForm(p => ({ ...p, to_postal_code: v }))}
                  label="CEP"
                  onAddressFound={(addr) => {
                    setReverseForm(p => ({
                      ...p,
                      to_address: addr.rua || p.to_address,
                      to_district: addr.bairro || p.to_district,
                      to_city: addr.cidade || p.to_city,
                      to_state_abbr: addr.uf || p.to_state_abbr,
                    }));
                  }}
                />
                <div className="col-span-2"><Label>Endereço</Label><Input value={reverseForm.to_address} onChange={(e) => setReverseForm(p => ({ ...p, to_address: e.target.value }))} /></div>
                <div><Label>Número</Label><Input value={reverseForm.to_number} onChange={(e) => setReverseForm(p => ({ ...p, to_number: e.target.value }))} /></div>
                <div><Label>Bairro</Label><Input value={reverseForm.to_district} onChange={(e) => setReverseForm(p => ({ ...p, to_district: e.target.value }))} /></div>
                <div><Label>Cidade</Label><Input value={reverseForm.to_city} onChange={(e) => setReverseForm(p => ({ ...p, to_city: e.target.value }))} /></div>
                <div><Label>UF</Label><Input value={reverseForm.to_state_abbr} onChange={(e) => setReverseForm(p => ({ ...p, to_state_abbr: e.target.value.toUpperCase() }))} maxLength={2} /></div>
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

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from "@/hooks/logistics/useMelhorEnvio";
import { Store, Loader2, Plus, MapPin, Phone, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/common/EmptyState';
import { MEErrorState } from './MEErrorState';
import { MECepAutoFill } from './MECepAutoFill';
import { formatCNPJ } from '@/lib/validations';
import type { MEStore, MEAddress } from './types';

interface StorePhone {
  phone?: string;
  number?: string;
}

export function MELojasPanel() {
  const { listarLojas, cadastrarLoja, visualizarLoja, cadastrarEnderecoLoja, listarEnderecosLoja, cadastrarTelefonesLoja, listarTelefonesLoja } = useMelhorEnvio();
  const [showNewStore, setShowNewStore] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', document: '', email: '', description: '' });
  const [storeDetail, setStoreDetail] = useState<MEStore | null>(null);
  const [storeAddresses, setStoreAddresses] = useState<MEAddress[]>([]);
  const [storePhones, setStorePhones] = useState<StorePhone[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [newAddress, setNewAddress] = useState({ postal_code: '', address: '', number: '', district: '', city: '', state_abbr: '', complement: '' });
  const [newPhone, setNewPhone] = useState({ phone: '', type: 'mobile' });

  const rawData = listarLojas.data;
  const rawDataObj = rawData as Record<string, unknown> | undefined;
  let stores: MEStore[] = [];
  if (Array.isArray(rawDataObj?.data)) stores = rawDataObj!.data as MEStore[];
  else if (Array.isArray(rawData)) stores = rawData as MEStore[];


  const handleCreate = () => {
    cadastrarLoja.mutate({
      ...newStore,
      document: newStore.document.replace(/\D/g, ''),
    } as Record<string, unknown>, {
      onSuccess: () => {
        setShowNewStore(false);
        setNewStore({ name: '', document: '', email: '', description: '' });
      },
    });
  };

  const parseArrayResponse = <T,>(data: unknown): T[] => {
    const d = data as Record<string, unknown> | undefined;
    if (Array.isArray(d?.data)) return d!.data as T[];
    if (Array.isArray(data)) return data as T[];
    return [];
  };


  const viewStore = (id: string) => {
    setSelectedStoreId(id);
    visualizarLoja.mutate(id, { onSuccess: (d) => setStoreDetail(d as MEStore) });
    listarEnderecosLoja.mutate(id, { onSuccess: (d) => setStoreAddresses(parseArrayResponse<MEAddress>(d)) });
    listarTelefonesLoja.mutate(id, { onSuccess: (d) => setStorePhones(parseArrayResponse<StorePhone>(d)) });
  };

  const handleAddAddress = () => {
    cadastrarEnderecoLoja.mutate({
      company_id: selectedStoreId,
      address: { ...newAddress, postal_code: newAddress.postal_code.replace(/\D/g, '') },
    }, {
      onSuccess: () => {
        setShowAddAddress(false);
        setNewAddress({ postal_code: '', address: '', number: '', district: '', city: '', state_abbr: '', complement: '' });
        listarEnderecosLoja.mutate(selectedStoreId, { onSuccess: (d) => setStoreAddresses(parseArrayResponse<MEAddress>(d)) });
      },
    });
  };

  const handleAddPhone = () => {
    cadastrarTelefonesLoja.mutate({ company_id: selectedStoreId, phones: newPhone }, {
      onSuccess: () => {
        setShowAddPhone(false);
        setNewPhone({ phone: '', type: 'mobile' });
        listarTelefonesLoja.mutate(selectedStoreId, { onSuccess: (d) => setStorePhones(parseArrayResponse<StorePhone>(d)) });
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Minhas Lojas
          </CardTitle>
          <Button size="sm" onClick={() => setShowNewStore(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Loja
          </Button>
        </CardHeader>
        <CardContent>
          {(() => {
            if (listarLojas.isLoading) return <TableSkeleton rows={3} columns={4} />;
            if (listarLojas.isError) {
              return <MEErrorState message="Erro ao carregar lojas." onRetry={() => listarLojas.refetch()} />;
            }
            if (stores.length === 0) {
              return (
                <EmptyState
                  variant="default"
                  title="Nenhuma loja cadastrada"
                  description="Crie uma loja para gerenciar endereços e telefones."
                  size="sm"
                  action={{ label: 'Nova Loja', onClick: () => setShowNewStore(true) }}
                />
              );
            }
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.document || s.company_document || '-'}</TableCell>
                      <TableCell>{s.email || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => viewStore(s.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>

      </Card>

      <Dialog open={showNewStore} onOpenChange={setShowNewStore}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastrar Nova Loja</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={newStore.name} onChange={(e) => setNewStore({ ...newStore, name: e.target.value })} /></div>
            <div><Label>CNPJ / CPF</Label><Input value={newStore.document} onChange={(e) => setNewStore({ ...newStore, document: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Email</Label><Input type="email" value={newStore.email} onChange={(e) => setNewStore({ ...newStore, email: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={newStore.description} onChange={(e) => setNewStore({ ...newStore, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={cadastrarLoja.isPending || !newStore.name}>
              {cadastrarLoja.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {storeDetail && (
        <Dialog open={!!storeDetail} onOpenChange={() => setStoreDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader><DialogTitle>Loja: {storeDetail.name}</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Documento:</span> {storeDetail.document || '-'}</div>
                <div><span className="text-muted-foreground">Email:</span> {storeDetail.email || '-'}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-1"><MapPin className="w-4 h-4" /> Endereços</h4>
                  <Button size="sm" variant="outline" onClick={() => setShowAddAddress(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {storeAddresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum endereço</p>
                ) : storeAddresses.map((a, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded mb-2 text-sm">
                    {a.address}, {a.number} - {a.district}, {a.city}/{a.state_abbr} - {a.postal_code}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-1"><Phone className="w-4 h-4" /> Telefones</h4>
                  <Button size="sm" variant="outline" onClick={() => setShowAddPhone(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {storePhones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum telefone</p>
                ) : storePhones.map((p, i) => (
                  <Badge key={i} variant="outline" className="mr-2 mb-1">{p.phone || p.number}</Badge>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Endereço</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <MECepAutoFill
              value={newAddress.postal_code}
              onChange={(v) => setNewAddress({ ...newAddress, postal_code: v })}
              label="CEP"
              onAddressFound={(addr) => {
                setNewAddress(prev => ({
                  ...prev,
                  address: addr.rua || prev.address,
                  district: addr.bairro || prev.district,
                  city: addr.cidade || prev.city,
                  state_abbr: addr.uf || prev.state_abbr,
                }));
              }}
            />
            <div><Label>UF</Label><Input value={newAddress.state_abbr} onChange={(e) => setNewAddress({ ...newAddress, state_abbr: e.target.value.toUpperCase() })} maxLength={2} /></div>
            <div className="col-span-2"><Label>Endereço</Label><Input value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} /></div>
            <div><Label>Número</Label><Input value={newAddress.number} onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })} /></div>
            <div><Label>Complemento</Label><Input value={newAddress.complement} onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })} /></div>
            <div><Label>Bairro</Label><Input value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddAddress} disabled={cadastrarEnderecoLoja.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPhone} onOpenChange={setShowAddPhone}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Telefone</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Telefone</Label><Input placeholder="11999999999" value={newPhone.phone} onChange={(e) => setNewPhone({ ...newPhone, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddPhone} disabled={cadastrarTelefonesLoja.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { Search, Loader2, UserPlus, Building2, MapPin, Edit, Trash2, Plus, Users, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';

export function RTECustomerManager() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState('search');

  // Search
  const [searchKey, setSearchKey] = useState('');
  const [searchTaxId, setSearchTaxId] = useState('');

  // New customer
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', tradeName: '', taxIdRegistration: '', email: '', phone: '' });

  // Addresses
  const [showAddresses, setShowAddresses] = useState(false);
  const [addressTaxId, setAddressTaxId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '', complement: '' });

  // List
  const [listDate, setListDate] = useState('');
  const [listPage, setListPage] = useState(1);

  // Person update
  const [showPersonUpdate, setShowPersonUpdate] = useState(false);
  const [personData, setPersonData] = useState({ personId: '', name: '', tradeName: '', email: '', phone: '' });

  const handleSearch = () => {
    if (searchTaxId) {
      rte.getCustomerByTaxId({ taxIdRegistration: searchTaxId.replace(/\D/g, '') });
    } else if (searchKey) {
      rte.searchCustomer({ description: searchKey });
    }
  };

  const handleSearchFull = () => {
    rte.searchCustomerFull({ description: searchKey || undefined, key: searchTaxId || undefined });
  };

  const handleSave = () => {
    rte.saveCustomer({ body: { Name: newCustomer.name, TradeName: newCustomer.tradeName, TaxIdRegistration: newCustomer.taxIdRegistration, Email: newCustomer.email, Phone: newCustomer.phone } });
    setShowNewCustomer(false);
    setNewCustomer({ name: '', tradeName: '', taxIdRegistration: '', email: '', phone: '' });
  };

  const handleListAddresses = () => {
    if (!addressTaxId) { toast.error('Informe o CNPJ/CPF'); return; }
    rte.listAddresses({ taxIdRegistration: addressTaxId.replace(/\D/g, '') });
    setShowAddresses(true);
  };

  const handleCreateAddress = () => {
    rte.createAddress({ body: { ...newAddress, taxIdRegistration: addressTaxId.replace(/\D/g, '') } });
    setShowNewAddress(false);
    setNewAddress({ street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '', complement: '' });
  };

  const handleList = () => {
    if (!listDate) return;
    rte.listCustomers({ lastChangedDate: listDate, page: listPage, amountByPage: 20 });
  };

  const handlePersonUpdate = () => {
    rte.updatePerson({ body: { PersonId: parseInt(personData.personId), Name: personData.name, TradeName: personData.tradeName, Email: personData.email, Phone: personData.phone } });
    setShowPersonUpdate(false);
  };

  const searchResults = rte.customerSearchResult as { data?: Array<Record<string, unknown>> } | undefined;
  const customers = Array.isArray(searchResults?.data) ? searchResults.data : searchResults?.data ? [searchResults.data] : [];
  const addressResults = rte.addressesResult as { data?: Array<Record<string, unknown>> } | undefined;
  const addresses = Array.isArray(addressResults?.data) ? addressResults.data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Gestão de Clientes RTE</h3>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowNewCustomer(true)}><UserPlus className="w-3 h-3 mr-1" />Novo Cliente</Button>
          <Button size="sm" variant="outline" onClick={() => setShowPersonUpdate(true)}><Edit className="w-3 h-3 mr-1" />Atualizar Pessoa</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="search"><Search className="w-3 h-3 mr-1" />Buscar</TabsTrigger>
          <TabsTrigger value="list"><ListOrdered className="w-3 h-3 mr-1" />Listar</TabsTrigger>
          <TabsTrigger value="addresses"><MapPin className="w-3 h-3 mr-1" />Endereços</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome/Razão Social</Label><Input value={searchKey} onChange={e => setSearchKey(e.target.value)} placeholder="Buscar por nome..." /></div>
            <div><Label>CNPJ/CPF</Label><Input value={searchTaxId} onChange={e => setSearchTaxId(e.target.value)} placeholder="00.000.000/0000-00" /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch}><Search className="w-4 h-4 mr-2" />Buscar</Button>
            <Button variant="outline" onClick={handleSearchFull}><Users className="w-4 h-4 mr-2" />Busca Completa</Button>
          </div>
          {customers.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{String(c.Name || c.name || 'N/A')}</span>
                    {c.PersonId && <Badge variant="outline">ID: {String(c.PersonId)}</Badge>}
                  </div>
                  {c.TradeName && <p className="text-xs text-muted-foreground">Fantasia: {String(c.TradeName)}</p>}
                  {c.TaxIdRegistration && <p className="text-xs text-muted-foreground">CNPJ: {String(c.TaxIdRegistration)}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Alterados desde *</Label><Input type="date" value={listDate} onChange={e => setListDate(e.target.value)} /></div>
            <div><Label>Página</Label><Input type="number" value={listPage} onChange={e => setListPage(parseInt(e.target.value) || 1)} min={1} /></div>
          </div>
          <Button onClick={handleList}><ListOrdered className="w-4 h-4 mr-2" />Listar Clientes</Button>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label>CNPJ/CPF do Cliente *</Label><Input value={addressTaxId} onChange={e => setAddressTaxId(e.target.value)} placeholder="00.000.000/0000-00" /></div>
            <Button onClick={handleListAddresses}><MapPin className="w-4 h-4 mr-2" />Buscar Endereços</Button>
            <Button variant="outline" onClick={() => setShowNewAddress(true)}><Plus className="w-4 h-4 mr-2" />Novo</Button>
          </div>
          {addresses.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {addresses.map((addr, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card text-sm flex justify-between items-center">
                  <div>
                    <p>{String(addr.Street || addr.street || '')} {String(addr.Number || addr.number || '')}</p>
                    <p className="text-xs text-muted-foreground">{String(addr.City || addr.city || '')} / {String(addr.State || addr.state || '')} - {String(addr.ZipCode || addr.zipCode || '')}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rte.deleteAddress({ id: Number(addr.Id || addr.id) })}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastrar Cliente na RTE</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Razão Social *</Label><Input value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Nome Fantasia</Label><Input value={newCustomer.tradeName} onChange={e => setNewCustomer(p => ({ ...p, tradeName: e.target.value }))} /></div>
            <div><Label>CNPJ/CPF *</Label><Input value={newCustomer.taxIdRegistration} onChange={e => setNewCustomer(p => ({ ...p, taxIdRegistration: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomer(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar na RTE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Address Dialog */}
      <Dialog open={showNewAddress} onOpenChange={setShowNewAddress}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Endereço RTE</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label>Rua *</Label><Input value={newAddress.street} onChange={e => setNewAddress(p => ({ ...p, street: e.target.value }))} /></div>
              <div><Label>Número</Label><Input value={newAddress.number} onChange={e => setNewAddress(p => ({ ...p, number: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bairro</Label><Input value={newAddress.neighborhood} onChange={e => setNewAddress(p => ({ ...p, neighborhood: e.target.value }))} /></div>
              <div><Label>Complemento</Label><Input value={newAddress.complement} onChange={e => setNewAddress(p => ({ ...p, complement: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cidade *</Label><Input value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} /></div>
              <div><Label>UF *</Label><Input value={newAddress.state} onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))} maxLength={2} /></div>
              <div><Label>CEP *</Label><Input value={newAddress.zipCode} onChange={e => setNewAddress(p => ({ ...p, zipCode: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAddress(false)}>Cancelar</Button>
            <Button onClick={handleCreateAddress}>Criar Endereço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Person Update Dialog */}
      <Dialog open={showPersonUpdate} onOpenChange={setShowPersonUpdate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atualizar Pessoa na RTE</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Person ID *</Label><Input value={personData.personId} onChange={e => setPersonData(p => ({ ...p, personId: e.target.value }))} type="number" /></div>
            <div><Label>Nome</Label><Input value={personData.name} onChange={e => setPersonData(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Nome Fantasia</Label><Input value={personData.tradeName} onChange={e => setPersonData(p => ({ ...p, tradeName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={personData.email} onChange={e => setPersonData(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={personData.phone} onChange={e => setPersonData(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPersonUpdate(false)}>Cancelar</Button>
            <Button onClick={handlePersonUpdate}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

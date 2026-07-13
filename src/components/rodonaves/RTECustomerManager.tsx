import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, MapPin, ListOrdered, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function RTECustomerManager() {
  const [searchKey, setSearchKey] = useState('');
  const [searchTaxId, setSearchTaxId] = useState('');
  const [searchById, setSearchById] = useState('');
  const [listDate, setListDate] = useState('');
  const [listPage, setListPage] = useState(1);
  const [addressTaxId, setAddressTaxId] = useState('');
  const [, setShowNewAddress] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('rodonaves-api', {
        body: { 
          action: 'get-customer-by-key',
          key: searchKey,
          taxId: searchTaxId
        }
      });
      if (error) throw error;
      setCustomers(data?.Result || []);
    } catch {
      toast.error('Erro ao buscar clientes');
    }
  };

  const handleSearchFull = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('rodonaves-api', {
        body: { 
          action: 'get-customer-full',
          taxId: searchTaxId
        }
      });
      if (error) throw error;
      setCustomers(data?.Result ? [data.Result] : []);
    } catch {
      toast.error('Erro na busca completa');
    }
  };

  const handleList = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('rodonaves-api', {
        body: { 
          action: 'list-customers',
          date: listDate,
          page: listPage
        }
      });
      if (error) throw error;
      setCustomers(data?.Result || []);
    } catch {
      toast.error('Erro ao listar clientes');
    }
  };

  const handleListAddresses = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('rodonaves-api', {
        body: { 
          action: 'list-customer-addresses',
          taxId: addressTaxId
        }
      });
      if (error) throw error;
      setAddresses(data?.Result || []);
    } catch {
      toast.error('Erro ao buscar endereços');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Gestão de Clientes Rodonaves
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search"><Search className="w-3 h-3 mr-1" />Buscar</TabsTrigger>
            <TabsTrigger value="list"><ListOrdered className="w-3 h-3 mr-1" />Listar</TabsTrigger>
            <TabsTrigger value="addresses"><MapPin className="w-3 h-3 mr-1" />Endereços</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome/Razão Social</Label>
                <Input value={searchKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKey(e.target.value)} placeholder="Buscar por nome..." />
              </div>
              <div>
                <Label>CNPJ/CPF</Label>
                <Input value={searchTaxId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTaxId(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSearch}><Search className="w-4 h-4 mr-2" />Buscar</Button>
              <Button variant="outline" onClick={handleSearchFull}><Users className="w-4 h-4 mr-2" />Busca Completa</Button>
            </div>
            <div className="flex gap-2 items-end border-t pt-3">
              <div className="w-40">
                <Label>ID do Cliente</Label>
                <Input value={searchById} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchById(e.target.value)} type="number" placeholder="Ex: 12345" />
              </div>
              <Button variant="outline" size="sm" onClick={() => { if (searchById) { /* getCustomerById */ } }}><Search className="w-3 h-3 mr-1" />Buscar por ID</Button>
            </div>
            {customers.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customers.map((c: any, i: number) => (
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
              <div>
                <Label>Alterados desde *</Label>
                <Input type="date" value={listDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setListDate(e.target.value)} />
              </div>
              <div>
                <Label>Página</Label>
                <Input type="number" value={listPage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setListPage(parseInt(e.target.value) || 1)} min={1} />
              </div>
            </div>
            <Button onClick={handleList}><ListOrdered className="w-4 h-4 mr-2" />Listar Clientes</Button>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>CNPJ/CPF do Cliente *</Label>
                <Input value={addressTaxId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressTaxId(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <Button onClick={handleListAddresses}><MapPin className="w-4 h-4 mr-2" />Buscar Endereços</Button>
              <Button variant="outline" onClick={() => setShowNewAddress(true)}><Plus className="w-4 h-4 mr-2" />Novo</Button>
            </div>
            {addresses.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {addresses.map((addr: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border bg-card text-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium">{String(addr.Street || 'Logradouro N/D')}, {String(addr.Number || 'S/N')}</p>
                      <p className="text-xs text-muted-foreground">{String(addr.CityName)} - {String(addr.StateAbbreviation)}</p>
                    </div>
                    <Badge variant="secondary">{String(addr.ZipCode)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

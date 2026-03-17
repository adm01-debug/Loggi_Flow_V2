import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { Truck, Loader2, MapPin, Building2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/common/EmptyState';
import { MEErrorState } from './MEErrorState';
import { MEDetailDialog } from './MEDetailDialog';
import type { MECompany, MEService, MEAgency } from './types';

export function METransportadorasPanel() {
  const { listarTransportadoras, listarServicos, listarAgencias, infoTransportadora, infoServico, infoAgencia } = useMelhorEnvio();
  const [agencyState, setAgencyState] = useState('');
  const [agencyCity, setAgencyCity] = useState('');
  const [agencyCompany, setAgencyCompany] = useState('');
  const [agencies, setAgencies] = useState<MEAgency[]>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailTitle, setDetailTitle] = useState('Detalhes');

  const companies: MECompany[] = Array.isArray(listarTransportadoras.data) ? listarTransportadoras.data as MECompany[] : [];
  const services: MEService[] = Array.isArray(listarServicos.data) ? listarServicos.data as MEService[] : [];

  const handleSearchAgencies = () => {
    const params: Record<string, string> = {};
    if (agencyCompany) params.company = agencyCompany;
    if (agencyState) params.state = agencyState;
    if (agencyCity) params.city = agencyCity;
    listarAgencias.mutate(params, {
      onSuccess: (data) => {
        const d = data as Record<string, unknown>;
        setAgencies(
          Array.isArray(d?.data) ? d.data as MEAgency[] :
          Array.isArray(data) ? data as MEAgency[] : []
        );
      },
    });
  };

  const showDetail = (id: string, type: 'transportadora' | 'servico' | 'agencia') => {
    const titleMap = { transportadora: 'Transportadora', servico: 'Serviço', agencia: 'Agência' };
    setDetailTitle(`Detalhes - ${titleMap[type]}`);
    const fn = type === 'transportadora' ? infoTransportadora : type === 'servico' ? infoServico : infoAgencia;
    fn.mutate(id, { onSuccess: (data) => setDetail(data as Record<string, unknown>) });
  };

  const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

  return (
    <Tabs defaultValue="transportadoras" className="space-y-4">
      <TabsList>
        <TabsTrigger value="transportadoras"><Truck className="w-4 h-4 mr-1" />Transportadoras</TabsTrigger>
        <TabsTrigger value="servicos"><Building2 className="w-4 h-4 mr-1" />Serviços</TabsTrigger>
        <TabsTrigger value="agencias"><MapPin className="w-4 h-4 mr-1" />Agências</TabsTrigger>
      </TabsList>

      <TabsContent value="transportadoras">
        <Card>
          <CardHeader><CardTitle>Transportadoras Disponíveis</CardTitle></CardHeader>
          <CardContent>
            {listarTransportadoras.isLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : listarTransportadoras.isError ? (
              <MEErrorState onRetry={() => listarTransportadoras.refetch()} />
            ) : companies.length === 0 ? (
              <EmptyState variant="delivery" title="Nenhuma transportadora" size="sm" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Imagem</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.picture ? <img src={c.picture} alt={c.name} className="h-8" /> : '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => showDetail(String(c.id), 'transportadora')}>
                          <Info className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="servicos">
        <Card>
          <CardHeader><CardTitle>Serviços de Envio</CardTitle></CardHeader>
          <CardContent>
            {listarServicos.isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : listarServicos.isError ? (
              <MEErrorState onRetry={() => listarServicos.refetch()} />
            ) : services.length === 0 ? (
              <EmptyState variant="default" title="Nenhum serviço" size="sm" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.id}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.company?.name || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{s.type || '-'}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => showDetail(String(s.id), 'servico')}>
                          <Info className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="agencias">
        <Card>
          <CardHeader><CardTitle>Buscar Agências / Pontos de Postagem</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Transportadora (ID)</Label>
                <Input placeholder="Ex: 1" value={agencyCompany} onChange={(e) => setAgencyCompany(e.target.value)} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={agencyState} onValueChange={setAgencyState}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cidade</Label>
                <Input placeholder="Ex: São Paulo" value={agencyCity} onChange={(e) => setAgencyCity(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSearchAgencies} disabled={listarAgencias.isPending}>
              {listarAgencias.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <MapPin className="w-4 h-4 mr-1" />}
              Buscar Agências
            </Button>

            {agencies.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.id}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-xs">{a.address || '-'}</TableCell>
                      <TableCell>{a.city || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => showDetail(String(a.id), 'agencia')}>
                          <Info className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <MEDetailDialog
        open={!!detail}
        onOpenChange={() => setDetail(null)}
        title={detailTitle}
        data={detail}
      />
    </Tabs>
  );
}

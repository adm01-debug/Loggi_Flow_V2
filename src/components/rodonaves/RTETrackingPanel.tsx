import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRodonavesTracking, RODONAVES_STATUS_MAP } from "@/hooks/logistics/useRodonavesTracking";
import { Search, Loader2, Package, ListOrdered, Filter, MapPin, Clock, Truck, FileText } from 'lucide-react';

export function RTETrackingPanel() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState('single');

  // Single tracking
  const [nfNumero, setNfNumero] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [invoiceKey, setInvoiceKey] = useState('');
  const [protocolNumber, setProtocolNumber] = useState('');

  // Batch tracking
  const [batchCnpj, setBatchCnpj] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Batch by params
  const [paramCnpj, setParamCnpj] = useState('');
  const [cteNumber, setCteNumber] = useState('');
  const [paramNf, setParamNf] = useState('');
  const [protocolParam, setProtocolParam] = useState('');

  const handleSingleTrack = () => {
    if (!nfNumero && !invoiceKey && !protocolNumber) return;
    rte.track({ nfNumero: nfNumero || undefined, cnpjRemetente: cnpj || undefined, invoiceKey: invoiceKey || undefined, protocolNumber: protocolNumber || undefined });
  };

  const handleSteps = () => {
    rte.getTrackingSteps({ nfNumero: nfNumero || undefined, cnpjRemetente: cnpj || undefined, invoiceKey: invoiceKey || undefined, protocolNumber: protocolNumber || undefined });
  };

  const handleBatch = () => {
    if (!batchCnpj || !startDate || !endDate) return;
    rte.trackBatch({ cnpjRemetente: batchCnpj, startDate, endDate, page });
  };

  const handleBatchPaginated = () => {
    if (!batchCnpj || !startDate || !endDate) return;
    rte.trackBatchPaginated({ cnpjRemetente: batchCnpj, startDate, endDate, page });
  };

  const handleBatchByOccurrence = () => {
    if (!batchCnpj || !startDate || !endDate) return;
    rte.trackBatchByOccurrence({ cnpjRemetente: batchCnpj, startDate, endDate, page });
  };

  const handleBatchByParams = () => {
    if (!paramCnpj) return;
    rte.trackBatchByParams({
      cnpjRemetente: paramCnpj,
      cTeNumber: cteNumber ? parseInt(cteNumber) : undefined,
      nfNumero: paramNf || undefined,
      protocolNumber: protocolParam || undefined,
      page,
    });
  };

  const renderEvents = (data: unknown) => {
    if (!data) return null;
    const d = data as { data?: { Tracking?: Array<any> } };
    const events = d?.data?.Tracking || (Array.isArray(d?.data) ? d.data : []);
    if (!Array.isArray(events) || events.length === 0) return <p className="text-sm text-muted-foreground">Nenhum evento encontrado</p>;

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.map((ev: any, i: number) => {
          const code = Number(ev.CodigoOcorrencia || ev.occurrenceCode || 0);
          const status = (RODONAVES_STATUS_MAP as any)[code];
          const severityColors: Record<string, string> = { 
            info: 'bg-primary/10 text-primary', 
            success: 'bg-success/10 text-success', 
            warning: 'bg-warning/10 text-warning', 
            error: 'bg-destructive/10 text-destructive' 
          };

          return (
            <div key={i} className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center justify-between">
                <Badge className={severityColors[status?.severity || 'info']}>{status?.label || String(ev.DescricaoOcorrencia || ev.description || `Código ${code}`)}</Badge>
                <span className="text-xs text-muted-foreground">{String(ev.DataOcorrencia || ev.date || '')} {String(ev.HoraOcorrencia || ev.time || '')}</span>
              </div>
              {(ev.Cidade || ev.city) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{String(ev.Cidade || ev.city)}/{String(ev.UF || ev.state || '')} - {String(ev.Filial || ev.branch || '')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBatchResults = (data: unknown) => {
    if (!data) return null;
    const d = data as { data?: any[] | any };
    const items = Array.isArray(d?.data) ? d.data : d?.data ? [d.data] : [];
    if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhum resultado</p>;
    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item: any, i: number) => (
          <div key={i} className="p-3 rounded-lg border bg-card text-sm">
            <pre className="whitespace-pre-wrap text-xs overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Rastreamento RTE Completo</h3>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="single"><Search className="w-3 h-3 mr-1" />Individual</TabsTrigger>
          <TabsTrigger value="batch"><ListOrdered className="w-3 h-3 mr-1" />Lote</TabsTrigger>
          <TabsTrigger value="params"><Filter className="w-3 h-3 mr-1" />Por Parâmetros</TabsTrigger>
          <TabsTrigger value="occurrence"><FileText className="w-3 h-3 mr-1" />Ocorrências</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>NF Número</Label><Input value={nfNumero} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNfNumero(e.target.value)} placeholder="Ex: 12345" /></div>
            <div><Label>CNPJ Remetente</Label><Input value={cnpj} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Chave NF-e</Label><Input value={invoiceKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceKey(e.target.value)} placeholder="44 dígitos" /></div>
            <div><Label>Protocolo</Label><Input value={protocolNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProtocolNumber(e.target.value)} placeholder="Ex: 987654" /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSingleTrack} disabled={rte.isTracking}>
              {rte.isTracking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}Rastrear
            </Button>
            <Button variant="outline" onClick={handleSteps} disabled={rte.isLoadingSteps}>
              {rte.isLoadingSteps ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}Passos Detalhados
            </Button>
          </div>
          {renderEvents(rte.trackingResult)}
          {rte.trackingSteps && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Passos Detalhados</h4>
              {renderBatchResults(rte.trackingSteps)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>CNPJ Remetente *</Label><Input value={batchCnpj} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBatchCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Data Início *</Label><Input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} /></div>
            <div><Label>Data Fim *</Label><Input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Label>Página:</Label>
            <Input type="number" value={page} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPage(parseInt(e.target.value) || 1)} className="w-20" min={1} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleBatch} disabled={rte.isTrackingBatch}>{rte.isTrackingBatch ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListOrdered className="w-4 h-4 mr-2" />}Lote Simples</Button>
            <Button variant="outline" onClick={handleBatchPaginated}><ListOrdered className="w-4 h-4 mr-2" />Lote Paginado</Button>
          </div>
          {renderBatchResults(rte.batchResult || rte.trackBatchPaginatedResult)}
        </TabsContent>

        <TabsContent value="params" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CNPJ Remetente *</Label><Input value={paramCnpj} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParamCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
            <div><Label>CT-e Número</Label><Input value={cteNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCteNumber(e.target.value)} type="number" /></div>
            <div><Label>NF Número</Label><Input value={paramNf} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParamNf(e.target.value)} /></div>
            <div><Label>Protocolo</Label><Input value={protocolParam} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProtocolParam(e.target.value)} /></div>
          </div>
          <Button onClick={handleBatchByParams}><Search className="w-4 h-4 mr-2" />Buscar por Parâmetros</Button>
          {renderBatchResults(rte.trackBatchByParamsResult)}
        </TabsContent>

        <TabsContent value="occurrence" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>CNPJ Remetente *</Label><Input value={batchCnpj} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBatchCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Data Início *</Label><Input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} /></div>
            <div><Label>Data Fim *</Label><Input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} /></div>
          </div>
          <Button onClick={handleBatchByOccurrence}><Filter className="w-4 h-4 mr-2" />Buscar por Ocorrências</Button>
          {renderBatchResults(rte.batchByOccurrenceResult)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

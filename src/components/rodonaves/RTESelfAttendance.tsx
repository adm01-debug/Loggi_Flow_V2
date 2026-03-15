import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { MapPin, Building, Search, Loader2, Calendar, Clock, Calculator, Bot, CheckCircle } from 'lucide-react';

export function RTESelfAttendance() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState('city');

  // City search
  const [cityDesc, setCityDesc] = useState('');
  const [cityUf, setCityUf] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Unit data
  const [unitId, setUnitId] = useState('');

  // Unit calendar
  const [calendarProtocol, setCalendarProtocol] = useState('');

  // Bot tracking
  const [botParams, setBotParams] = useState({ nfNumero: '', cnpj: '', invoiceKey: '' });

  // Self-attendance quotation
  const [saQuotation, setSaQuotation] = useState({ cepOrigem: '', cepDestino: '', peso: '', volumes: '1', valor: '' });

  // Self-attendance delivery time
  const [saDelivery, setSaDelivery] = useState({ cepOrigem: '', cepDestino: '' });

  // Validate customer quotation
  const [validateTaxId, setValidateTaxId] = useState('');

  const renderResult = (data: unknown) => {
    if (!data) return null;
    const d = data as { data?: unknown };
    return (
      <div className="mt-3 p-3 border rounded-lg bg-card">
        <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-y-auto">{JSON.stringify(d?.data || d, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Autoatendimento RTE</h3>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="city"><MapPin className="w-3 h-3 mr-1" />Cidades</TabsTrigger>
          <TabsTrigger value="unit"><Building className="w-3 h-3 mr-1" />Unidades</TabsTrigger>
          <TabsTrigger value="bot"><Bot className="w-3 h-3 mr-1" />Bot Tracking</TabsTrigger>
          <TabsTrigger value="quotation"><Calculator className="w-3 h-3 mr-1" />Cotação SA</TabsTrigger>
          <TabsTrigger value="delivery"><Clock className="w-3 h-3 mr-1" />Prazo SA</TabsTrigger>
          <TabsTrigger value="validate"><CheckCircle className="w-3 h-3 mr-1" />Validar</TabsTrigger>
        </TabsList>

        <TabsContent value="city" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Nome da Cidade</Label><Input value={cityDesc} onChange={e => setCityDesc(e.target.value)} placeholder="Ex: São Paulo" /></div>
            <div><Label>UF</Label><Input value={cityUf} onChange={e => setCityUf(e.target.value)} maxLength={2} placeholder="SP" /></div>
            <div><Label>CEP</Label><Input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="00000-000" /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => rte.searchCity({ description: cityDesc, uf: cityUf || undefined })} disabled={!cityDesc}>
              <Search className="w-4 h-4 mr-2" />Buscar Cidade
            </Button>
            <Button variant="outline" onClick={() => rte.getCityByZipCode({ zipCode: zipCode.replace(/\D/g, '') })} disabled={!zipCode}>
              <MapPin className="w-4 h-4 mr-2" />Cidade por CEP
            </Button>
            <Button variant="outline" onClick={() => rte.getAddressByZipCode({ zipCode: zipCode.replace(/\D/g, '') })} disabled={!zipCode}>
              <MapPin className="w-4 h-4 mr-2" />Endereço por CEP
            </Button>
          </div>
          {renderResult(rte.citySearchResult)}
          {renderResult(rte.cityByZipCodeResult)}
          {renderResult(rte.addressByZipCodeResult)}
        </TabsContent>

        <TabsContent value="unit" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ID da Unidade</Label>
              <Input value={unitId} onChange={e => setUnitId(e.target.value)} type="number" placeholder="Opcional - vazio lista todas" />
            </div>
            <div>
              <Label>Protocolo (para Calendário)</Label>
              <Input value={calendarProtocol} onChange={e => setCalendarProtocol(e.target.value)} type="number" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => rte.getUnitData({ unitId: unitId ? parseInt(unitId) : undefined })}>
              <Building className="w-4 h-4 mr-2" />Dados da Unidade
            </Button>
            <Button variant="outline" onClick={() => rte.getUnitCalendar({ protocol: parseInt(calendarProtocol) })} disabled={!calendarProtocol}>
              <Calendar className="w-4 h-4 mr-2" />Calendário
            </Button>
          </div>
          {renderResult(rte.unitDataResult)}
          {renderResult(rte.unitCalendarResult)}
        </TabsContent>

        <TabsContent value="bot" className="space-y-4">
          <p className="text-sm text-muted-foreground">Rastreamento via Bot (endpoints de autoatendimento).</p>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>NF Número</Label><Input value={botParams.nfNumero} onChange={e => setBotParams(p => ({ ...p, nfNumero: e.target.value }))} /></div>
            <div><Label>CNPJ</Label><Input value={botParams.cnpj} onChange={e => setBotParams(p => ({ ...p, cnpj: e.target.value }))} /></div>
            <div><Label>Chave NF-e</Label><Input value={botParams.invoiceKey} onChange={e => setBotParams(p => ({ ...p, invoiceKey: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => rte.getTrackingStepsBot({ nfNumero: botParams.nfNumero || undefined, cnpjRemetente: botParams.cnpj || undefined, invoiceKey: botParams.invoiceKey || undefined })}>
              <Bot className="w-4 h-4 mr-2" />Passos Bot
            </Button>
            <Button variant="outline" onClick={() => rte.getTrackingLastStepsBot({ nfNumero: botParams.nfNumero || undefined, cnpjRemetente: botParams.cnpj || undefined, invoiceKey: botParams.invoiceKey || undefined })}>
              <Bot className="w-4 h-4 mr-2" />Últimos Passos
            </Button>
          </div>
          {renderResult(rte.trackingStepsBotResult)}
        </TabsContent>

        <TabsContent value="quotation" className="space-y-4">
          <p className="text-sm text-muted-foreground">Cotação via autoatendimento RTE.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><Label>CEP Origem *</Label><Input value={saQuotation.cepOrigem} onChange={e => setSaQuotation(p => ({ ...p, cepOrigem: e.target.value }))} /></div>
            <div><Label>CEP Destino *</Label><Input value={saQuotation.cepDestino} onChange={e => setSaQuotation(p => ({ ...p, cepDestino: e.target.value }))} /></div>
            <div><Label>Peso (kg) *</Label><Input value={saQuotation.peso} onChange={e => setSaQuotation(p => ({ ...p, peso: e.target.value }))} type="number" /></div>
            <div><Label>Volumes</Label><Input value={saQuotation.volumes} onChange={e => setSaQuotation(p => ({ ...p, volumes: e.target.value }))} type="number" /></div>
            <div><Label>Valor Merc.</Label><Input value={saQuotation.valor} onChange={e => setSaQuotation(p => ({ ...p, valor: e.target.value }))} type="number" /></div>
          </div>
          <Button onClick={() => rte.selfAttendanceQuotation({ body: { OriginZipCode: saQuotation.cepOrigem, DestinationZipCode: saQuotation.cepDestino, Weight: parseFloat(saQuotation.peso), Volumes: parseInt(saQuotation.volumes), MerchandiseValue: parseFloat(saQuotation.valor) || 0 } })}>
            <Calculator className="w-4 h-4 mr-2" />Cotar (Self-Attendance)
          </Button>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <p className="text-sm text-muted-foreground">Calcular prazo de entrega via autoatendimento.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CEP Origem *</Label><Input value={saDelivery.cepOrigem} onChange={e => setSaDelivery(p => ({ ...p, cepOrigem: e.target.value }))} /></div>
            <div><Label>CEP Destino *</Label><Input value={saDelivery.cepDestino} onChange={e => setSaDelivery(p => ({ ...p, cepDestino: e.target.value }))} /></div>
          </div>
          <Button onClick={() => rte.selfAttendanceDeliveryTime({ body: { OriginZipCode: saDelivery.cepOrigem, DestinationZipCode: saDelivery.cepDestino } })}>
            <Clock className="w-4 h-4 mr-2" />Calcular Prazo
          </Button>
        </TabsContent>

        <TabsContent value="validate" className="space-y-4">
          <p className="text-sm text-muted-foreground">Valide se um cliente está apto para cotação na RTE.</p>
          <div className="max-w-sm">
            <Label>CNPJ/CPF *</Label>
            <Input value={validateTaxId} onChange={e => setValidateTaxId(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <Button onClick={() => rte.validateCustomerForQuotation({ taxId: validateTaxId.replace(/\D/g, '') })}>
            <CheckCircle className="w-4 h-4 mr-2" />Validar Cliente
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

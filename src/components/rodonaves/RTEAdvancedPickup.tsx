import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRodonavesTracking } from "@/hooks/logistics/useRodonavesTracking";
import { Truck, Plus, Loader2, CalendarDays, RefreshCw, Zap, FileText } from 'lucide-react';

export function RTEAdvancedPickup() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState('create');
  const [showCreate, setShowCreate] = useState(false);

  // Create pickup form
  const [pickupForm, setPickupForm] = useState({
    senderTaxId: '', recipientTaxId: '', pickupDate: '', 
    street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '',
    volumes: '1', weight: '', merchandiseValue: '', observations: '',
  });

  // Automatic pickup
  const [autoForm, setAutoForm] = useState({ senderTaxId: '', recipientTaxId: '', invoiceKey: '' });

  // Express resend / get by ID
  const [pickupId, setPickupId] = useState('');

  // Dates by params
  const [datesParams, setDatesParams] = useState({ senderZip: '', recipientZip: '', weight: '' });

  // Reschedule or Finalize
  const [rofForm, setRofForm] = useState({ protocol: '', action: 'reschedule', newDate: '' });

  const handleCreate = () => {
    rte.createPickup({
      body: {
        SenderTaxIdRegistration: pickupForm.senderTaxId,
        RecipientTaxIdRegistration: pickupForm.recipientTaxId,
        PickupDate: new Date(pickupForm.pickupDate).toISOString(),
        Address: { Street: pickupForm.street, Number: pickupForm.number, Neighborhood: pickupForm.neighborhood, City: pickupForm.city, State: pickupForm.state, ZipCode: pickupForm.zipCode },
        Volumes: parseInt(pickupForm.volumes) || 1,
        Weight: parseFloat(pickupForm.weight) || 0,
        MerchandiseValue: parseFloat(pickupForm.merchandiseValue) || 0,
        Observations: pickupForm.observations,
      }
    });
    setShowCreate(false);
  };

  const handleAutomatic = () => {
    rte.generateAutomaticPickup({
      body: {
        SenderTaxIdRegistration: autoForm.senderTaxId,
        RecipientTaxIdRegistration: autoForm.recipientTaxId,
        InvoiceKey: autoForm.invoiceKey,
      }
    });
  };

  const handleExpressResend = () => {
    if (!pickupId) return;
    rte.resendExpressPickup({ id: parseInt(pickupId) });
  };

  const handleGetById = () => {
    if (!pickupId) return;
    rte.getPickup({ id: parseInt(pickupId) });
  };

  const handleDatesByParams = () => {
    rte.getAvailableDatesByParams({
      senderZipCode: datesParams.senderZip,
      recipientZipCode: datesParams.recipientZip,
      weight: parseFloat(datesParams.weight) || 0,
    });
  };

  const handleRescheduleOrFinalize = () => {
    rte.pickupRescheduleOrFinalize({
      protocol: parseInt(rofForm.protocol),
      action: rofForm.action,
      newDate: rofForm.newDate ? new Date(rofForm.newDate).toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Coletas Avançadas RTE</h3>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-3 h-3 mr-1" />Nova Coleta RTE
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="create"><Plus className="w-3 h-3 mr-1" />Criar</TabsTrigger>
          <TabsTrigger value="automatic"><Zap className="w-3 h-3 mr-1" />Automática</TabsTrigger>
          <TabsTrigger value="manage"><RefreshCw className="w-3 h-3 mr-1" />Gerenciar</TabsTrigger>
          <TabsTrigger value="dates"><CalendarDays className="w-3 h-3 mr-1" />Datas</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <p className="text-sm text-muted-foreground">Crie uma coleta diretamente na RTE informando dados do remetente e destinatário.</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Abrir Formulário de Coleta</Button>
        </TabsContent>

        <TabsContent value="automatic" className="space-y-4">
          <p className="text-sm text-muted-foreground">Gere uma coleta automática a partir da chave NF-e.</p>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>CNPJ Remetente *</Label><Input value={autoForm.senderTaxId} onChange={e => setAutoForm(p => ({ ...p, senderTaxId: e.target.value }))} /></div>
            <div><Label>CNPJ Destinatário</Label><Input value={autoForm.recipientTaxId} onChange={e => setAutoForm(p => ({ ...p, recipientTaxId: e.target.value }))} /></div>
            <div><Label>Chave NF-e *</Label><Input value={autoForm.invoiceKey} onChange={e => setAutoForm(p => ({ ...p, invoiceKey: e.target.value }))} /></div>
          </div>
          <Button onClick={handleAutomatic}>
            <Zap className="w-4 h-4 mr-2" />Gerar Coleta Automática
          </Button>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ID da Coleta</Label>
              <Input value={pickupId} onChange={e => setPickupId(e.target.value)} type="number" placeholder="Ex: 12345" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={handleGetById}><FileText className="w-4 h-4 mr-2" />Consultar por ID</Button>
              <Button variant="outline" onClick={handleExpressResend}><Zap className="w-4 h-4 mr-2" />Reenviar Express</Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Reagendar ou Finalizar</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Protocolo *</Label><Input value={rofForm.protocol} onChange={e => setRofForm(p => ({ ...p, protocol: e.target.value }))} type="number" /></div>
              <div>
                <Label>Ação</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={rofForm.action} onChange={e => setRofForm(p => ({ ...p, action: e.target.value }))}>
                  <option value="reschedule">Reagendar</option>
                  <option value="finalize">Finalizar</option>
                </select>
              </div>
              <div><Label>Nova Data</Label><Input type="datetime-local" value={rofForm.newDate} onChange={e => setRofForm(p => ({ ...p, newDate: e.target.value }))} /></div>
            </div>
            <Button className="mt-2" onClick={handleRescheduleOrFinalize}><RefreshCw className="w-4 h-4 mr-2" />Executar</Button>
          </div>

          {rte.pickupResult && (
            <div className="p-3 border rounded-lg bg-card">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify((rte.pickupResult as Record<string, unknown>)?.data, null, 2)}</pre>
            </div>
          )}
        </TabsContent>

        <TabsContent value="dates" className="space-y-4">
          <p className="text-sm text-muted-foreground">Consulte datas disponíveis para coleta por parâmetros de CEP e peso.</p>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>CEP Remetente *</Label><Input value={datesParams.senderZip} onChange={e => setDatesParams(p => ({ ...p, senderZip: e.target.value }))} /></div>
            <div><Label>CEP Destinatário *</Label><Input value={datesParams.recipientZip} onChange={e => setDatesParams(p => ({ ...p, recipientZip: e.target.value }))} /></div>
            <div><Label>Peso (kg)</Label><Input value={datesParams.weight} onChange={e => setDatesParams(p => ({ ...p, weight: e.target.value }))} type="number" /></div>
          </div>
          <Button onClick={handleDatesByParams}><CalendarDays className="w-4 h-4 mr-2" />Consultar Datas</Button>
        </TabsContent>
      </Tabs>

      {/* Create Pickup Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Coleta RTE</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CNPJ Remetente *</Label><Input value={pickupForm.senderTaxId} onChange={e => setPickupForm(p => ({ ...p, senderTaxId: e.target.value }))} /></div>
              <div><Label>CNPJ Destinatário *</Label><Input value={pickupForm.recipientTaxId} onChange={e => setPickupForm(p => ({ ...p, recipientTaxId: e.target.value }))} /></div>
            </div>
            <div><Label>Data da Coleta *</Label><Input type="datetime-local" value={pickupForm.pickupDate} onChange={e => setPickupForm(p => ({ ...p, pickupDate: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label>Rua *</Label><Input value={pickupForm.street} onChange={e => setPickupForm(p => ({ ...p, street: e.target.value }))} /></div>
              <div><Label>Número</Label><Input value={pickupForm.number} onChange={e => setPickupForm(p => ({ ...p, number: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Bairro</Label><Input value={pickupForm.neighborhood} onChange={e => setPickupForm(p => ({ ...p, neighborhood: e.target.value }))} /></div>
              <div><Label>Cidade *</Label><Input value={pickupForm.city} onChange={e => setPickupForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div><Label>UF *</Label><Input value={pickupForm.state} onChange={e => setPickupForm(p => ({ ...p, state: e.target.value }))} maxLength={2} /></div>
            </div>
            <div><Label>CEP *</Label><Input value={pickupForm.zipCode} onChange={e => setPickupForm(p => ({ ...p, zipCode: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Volumes</Label><Input value={pickupForm.volumes} onChange={e => setPickupForm(p => ({ ...p, volumes: e.target.value }))} type="number" /></div>
              <div><Label>Peso (kg)</Label><Input value={pickupForm.weight} onChange={e => setPickupForm(p => ({ ...p, weight: e.target.value }))} type="number" /></div>
              <div><Label>Valor Mercadoria</Label><Input value={pickupForm.merchandiseValue} onChange={e => setPickupForm(p => ({ ...p, merchandiseValue: e.target.value }))} type="number" /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={pickupForm.observations} onChange={e => setPickupForm(p => ({ ...p, observations: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={rte.isCreatingPickup}>
              {rte.isCreatingPickup ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Criar Coleta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

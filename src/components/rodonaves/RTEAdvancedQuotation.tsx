import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRodonavesTracking } from "@/hooks/logistics/useRodonavesTracking";
import { Calculator, FileText, Loader2, Truck, RefreshCw, Key } from 'lucide-react';

export function RTEAdvancedQuotation() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState('generate');

  // Generate quotation
  const [genForm, setGenForm] = useState({ senderTaxId: '', recipientTaxId: '', originZip: '', destinationZip: '', weight: '', volumes: '1', merchandiseValue: '' });

  // First quotation
  const [firstForm, setFirstForm] = useState({ senderTaxId: '', recipientTaxId: '', originZip: '', destinationZip: '', weight: '', volumes: '1', merchandiseValue: '' });

  // Update contact
  const [contactForm, setContactForm] = useState({ quotationId: '', contactName: '', contactPhone: '', contactEmail: '' });

  // Digital carrier
  const [digitalForm, setDigitalForm] = useState({ senderTaxId: '', recipientTaxId: '', originZip: '', destinationZip: '', weight: '', volumes: '1', merchandiseValue: '' });

  // Update invoice key
  const [invoiceForm, setInvoiceForm] = useState({ quotationId: '', invoiceKey: '' });

  // Create by quotation
  const [pickupQuotationId, setPickupQuotationId] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Cotações Avançadas RTE / TMS</h3>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="generate"><Calculator className="w-3 h-3 mr-1" />Gerar TMS</TabsTrigger>
          <TabsTrigger value="first"><FileText className="w-3 h-3 mr-1" />Primeira</TabsTrigger>
          <TabsTrigger value="digital"><Truck className="w-3 h-3 mr-1" />Digital</TabsTrigger>
          <TabsTrigger value="contact"><RefreshCw className="w-3 h-3 mr-1" />Contato</TabsTrigger>
          <TabsTrigger value="invoice"><Key className="w-3 h-3 mr-1" />Chave NF-e</TabsTrigger>
          <TabsTrigger value="pickup"><Truck className="w-3 h-3 mr-1" />Coleta via Cotação</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <p className="text-sm text-muted-foreground">Gera uma cotação completa no sistema TMS da Rodonaves.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>CNPJ Remetente *</Label><Input value={genForm.senderTaxId} onChange={e => setGenForm(p => ({ ...p, senderTaxId: e.target.value }))} /></div>
            <div><Label>CNPJ Destinatário *</Label><Input value={genForm.recipientTaxId} onChange={e => setGenForm(p => ({ ...p, recipientTaxId: e.target.value }))} /></div>
            <div><Label>CEP Origem *</Label><Input value={genForm.originZip} onChange={e => setGenForm(p => ({ ...p, originZip: e.target.value }))} /></div>
            <div><Label>CEP Destino *</Label><Input value={genForm.destinationZip} onChange={e => setGenForm(p => ({ ...p, destinationZip: e.target.value }))} /></div>
            <div><Label>Peso (kg) *</Label><Input value={genForm.weight} onChange={e => setGenForm(p => ({ ...p, weight: e.target.value }))} type="number" /></div>
            <div><Label>Volumes</Label><Input value={genForm.volumes} onChange={e => setGenForm(p => ({ ...p, volumes: e.target.value }))} type="number" /></div>
            <div><Label>Valor Merc. (R$)</Label><Input value={genForm.merchandiseValue} onChange={e => setGenForm(p => ({ ...p, merchandiseValue: e.target.value }))} type="number" /></div>
          </div>
          <Button onClick={() => rte.generateQuotation({ body: { SenderTaxIdRegistration: genForm.senderTaxId, RecipientTaxIdRegistration: genForm.recipientTaxId, OriginZipCode: genForm.originZip, DestinationZipCode: genForm.destinationZip, Weight: parseFloat(genForm.weight), Volumes: parseInt(genForm.volumes), MerchandiseValue: parseFloat(genForm.merchandiseValue) || 0 } })}>
            <Calculator className="w-4 h-4 mr-2" />Gerar Cotação TMS
          </Button>
        </TabsContent>

        <TabsContent value="first" className="space-y-4">
          <p className="text-sm text-muted-foreground">Gera a primeira cotação para novos clientes.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>CNPJ Remetente *</Label><Input value={firstForm.senderTaxId} onChange={e => setFirstForm(p => ({ ...p, senderTaxId: e.target.value }))} /></div>
            <div><Label>CNPJ Destinatário *</Label><Input value={firstForm.recipientTaxId} onChange={e => setFirstForm(p => ({ ...p, recipientTaxId: e.target.value }))} /></div>
            <div><Label>CEP Origem *</Label><Input value={firstForm.originZip} onChange={e => setFirstForm(p => ({ ...p, originZip: e.target.value }))} /></div>
            <div><Label>CEP Destino *</Label><Input value={firstForm.destinationZip} onChange={e => setFirstForm(p => ({ ...p, destinationZip: e.target.value }))} /></div>
            <div><Label>Peso (kg) *</Label><Input value={firstForm.weight} onChange={e => setFirstForm(p => ({ ...p, weight: e.target.value }))} type="number" /></div>
            <div><Label>Volumes</Label><Input value={firstForm.volumes} onChange={e => setFirstForm(p => ({ ...p, volumes: e.target.value }))} type="number" /></div>
            <div><Label>Valor Merc.</Label><Input value={firstForm.merchandiseValue} onChange={e => setFirstForm(p => ({ ...p, merchandiseValue: e.target.value }))} type="number" /></div>
          </div>
          <Button onClick={() => rte.generateFirstQuotation({ body: { SenderTaxIdRegistration: firstForm.senderTaxId, RecipientTaxIdRegistration: firstForm.recipientTaxId, OriginZipCode: firstForm.originZip, DestinationZipCode: firstForm.destinationZip, Weight: parseFloat(firstForm.weight), Volumes: parseInt(firstForm.volumes), MerchandiseValue: parseFloat(firstForm.merchandiseValue) || 0 } })}>
            <FileText className="w-4 h-4 mr-2" />Gerar Primeira Cotação
          </Button>
        </TabsContent>

        <TabsContent value="digital" className="space-y-4">
          <p className="text-sm text-muted-foreground">Gera cotação para transportadora digital.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>CNPJ Remetente *</Label><Input value={digitalForm.senderTaxId} onChange={e => setDigitalForm(p => ({ ...p, senderTaxId: e.target.value }))} /></div>
            <div><Label>CNPJ Destinatário *</Label><Input value={digitalForm.recipientTaxId} onChange={e => setDigitalForm(p => ({ ...p, recipientTaxId: e.target.value }))} /></div>
            <div><Label>CEP Origem *</Label><Input value={digitalForm.originZip} onChange={e => setDigitalForm(p => ({ ...p, originZip: e.target.value }))} /></div>
            <div><Label>CEP Destino *</Label><Input value={digitalForm.destinationZip} onChange={e => setDigitalForm(p => ({ ...p, destinationZip: e.target.value }))} /></div>
            <div><Label>Peso (kg) *</Label><Input value={digitalForm.weight} onChange={e => setDigitalForm(p => ({ ...p, weight: e.target.value }))} type="number" /></div>
            <div><Label>Volumes</Label><Input value={digitalForm.volumes} onChange={e => setDigitalForm(p => ({ ...p, volumes: e.target.value }))} type="number" /></div>
            <div><Label>Valor Merc.</Label><Input value={digitalForm.merchandiseValue} onChange={e => setDigitalForm(p => ({ ...p, merchandiseValue: e.target.value }))} type="number" /></div>
          </div>
          <Button onClick={() => rte.digitalCarrierQuotation({ body: { SenderTaxIdRegistration: digitalForm.senderTaxId, RecipientTaxIdRegistration: digitalForm.recipientTaxId, OriginZipCode: digitalForm.originZip, DestinationZipCode: digitalForm.destinationZip, Weight: parseFloat(digitalForm.weight), Volumes: parseInt(digitalForm.volumes), MerchandiseValue: parseFloat(digitalForm.merchandiseValue) || 0 } })}>
            <Truck className="w-4 h-4 mr-2" />Cotação Digital
          </Button>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <p className="text-sm text-muted-foreground">Atualizar dados de contato de uma cotação existente.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>ID da Cotação *</Label><Input value={contactForm.quotationId} onChange={e => setContactForm(p => ({ ...p, quotationId: e.target.value }))} /></div>
            <div><Label>Nome do Contato</Label><Input value={contactForm.contactName} onChange={e => setContactForm(p => ({ ...p, contactName: e.target.value }))} /></div>
            <div><Label>Telefone</Label><Input value={contactForm.contactPhone} onChange={e => setContactForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={contactForm.contactEmail} onChange={e => setContactForm(p => ({ ...p, contactEmail: e.target.value }))} /></div>
          </div>
          <Button onClick={() => rte.updateQuotationContact({ body: { QuotationId: contactForm.quotationId, ContactName: contactForm.contactName, ContactPhone: contactForm.contactPhone, ContactEmail: contactForm.contactEmail } })}>
            <RefreshCw className="w-4 h-4 mr-2" />Atualizar Contato
          </Button>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4">
          <p className="text-sm text-muted-foreground">Vincular chave NF-e a uma cotação existente.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>ID da Cotação *</Label><Input value={invoiceForm.quotationId} onChange={e => setInvoiceForm(p => ({ ...p, quotationId: e.target.value }))} /></div>
            <div><Label>Chave NF-e *</Label><Input value={invoiceForm.invoiceKey} onChange={e => setInvoiceForm(p => ({ ...p, invoiceKey: e.target.value }))} placeholder="44 dígitos" /></div>
          </div>
          <Button onClick={() => rte.updateQuotationInvoiceKey({ body: { QuotationId: invoiceForm.quotationId, InvoiceKey: invoiceForm.invoiceKey } })}>
            <Key className="w-4 h-4 mr-2" />Vincular NF-e
          </Button>
        </TabsContent>

        <TabsContent value="pickup" className="space-y-4">
          <p className="text-sm text-muted-foreground">Criar coleta diretamente a partir de uma cotação existente.</p>
          <div className="max-w-sm">
            <Label>ID da Cotação *</Label>
            <Input value={pickupQuotationId} onChange={e => setPickupQuotationId(e.target.value)} placeholder="Ex: QT-12345" />
          </div>
          <Button onClick={() => rte.createPickupByQuotation({ body: { QuotationId: pickupQuotationId } })}>
            <Truck className="w-4 h-4 mr-2" />Criar Coleta via Cotação
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

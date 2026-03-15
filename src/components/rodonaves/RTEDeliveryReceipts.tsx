import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { FileText, Download, Loader2, Image, Eye, ListOrdered } from 'lucide-react';

export function RTEDeliveryReceipts() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState('proof');

  // Single proof
  const [nfNumero, setNfNumero] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [invoiceKey, setInvoiceKey] = useState('');
  const [protocolNumber, setProtocolNumber] = useState('');

  // Occurrence
  const [billOfLadingId, setBillOfLadingId] = useState('');
  const [occurrenceCode, setOccurrenceCode] = useState('');

  // Batch
  const [batchProtocols, setBatchProtocols] = useState('');

  const params = {
    nfNumero: nfNumero || undefined,
    cnpjRemetente: cnpj || undefined,
    invoiceKey: invoiceKey || undefined,
    protocolNumber: protocolNumber || undefined,
  };

  const renderResult = (data: unknown) => {
    if (!data) return null;
    const d = data as Record<string, unknown>;
    const inner = d?.data as Record<string, unknown>;
    if (inner?.ImageBase64 || inner?.imageBase64) {
      return (
        <div className="mt-4 p-3 border rounded-lg bg-card">
          <p className="text-sm font-medium mb-2">Comprovante obtido:</p>
          <img src={`data:image/png;base64,${inner.ImageBase64 || inner.imageBase64}`} alt="Comprovante" className="max-w-full rounded border" />
        </div>
      );
    }
    if (inner?.Url || inner?.url) {
      return (
        <div className="mt-4 p-3 border rounded-lg bg-card">
          <a href={String(inner.Url || inner.url)} target="_blank" rel="noreferrer" className="text-primary underline text-sm">📥 Baixar Comprovante</a>
        </div>
      );
    }
    return (
      <div className="mt-4 p-3 border rounded-lg bg-card">
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(d?.data || d, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Comprovantes e Recibos RTE</h3>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="proof"><FileText className="w-3 h-3 mr-1" />Comprovante</TabsTrigger>
          <TabsTrigger value="info"><Eye className="w-3 h-3 mr-1" />Info Entrega</TabsTrigger>
          <TabsTrigger value="occurrence"><Image className="w-3 h-3 mr-1" />Ocorrência</TabsTrigger>
          <TabsTrigger value="batch"><ListOrdered className="w-3 h-3 mr-1" />Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="proof" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>NF Número</Label><Input value={nfNumero} onChange={e => setNfNumero(e.target.value)} /></div>
            <div><Label>CNPJ Remetente</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} /></div>
            <div><Label>Chave NF-e</Label><Input value={invoiceKey} onChange={e => setInvoiceKey(e.target.value)} /></div>
            <div><Label>Protocolo</Label><Input value={protocolNumber} onChange={e => setProtocolNumber(e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => rte.getDeliveryProof(params)} disabled={rte.isLoadingProof}>
              {rte.isLoadingProof ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Comprovante Normal
            </Button>
            <Button variant="outline" onClick={() => rte.getDeliveryProofHQ(params)}>
              <Download className="w-4 h-4 mr-2" />Comprovante HD
            </Button>
          </div>
          {renderResult(rte.deliveryProof)}
          {renderResult(rte.deliveryProofHQ)}
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>NF Número</Label><Input value={nfNumero} onChange={e => setNfNumero(e.target.value)} /></div>
            <div><Label>CNPJ Remetente</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} /></div>
            <div><Label>Protocolo</Label><Input value={protocolNumber} onChange={e => setProtocolNumber(e.target.value)} /></div>
          </div>
          <Button onClick={() => rte.getDeliveryInfo({ nfNumero: nfNumero || undefined, cnpjRemetente: cnpj || undefined, protocolNumber: protocolNumber || undefined })} disabled={rte.isLoadingDeliveryInfo}>
            {rte.isLoadingDeliveryInfo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}Consultar Info
          </Button>
          {renderResult(rte.deliveryInfo)}
        </TabsContent>

        <TabsContent value="occurrence" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Bill of Lading ID *</Label><Input type="number" value={billOfLadingId} onChange={e => setBillOfLadingId(e.target.value)} /></div>
            <div><Label>Código Ocorrência *</Label><Input value={occurrenceCode} onChange={e => setOccurrenceCode(e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => rte.getOccurrenceReceipt({ billOfLadingId: parseInt(billOfLadingId), occurrenceCode, loadImageContent: true })}>
              <FileText className="w-4 h-4 mr-2" />Comprovante
            </Button>
            <Button variant="outline" onClick={() => rte.getOccurrenceReceiptList({ billOfLadingId: parseInt(billOfLadingId), occurrenceCode })}>
              <ListOrdered className="w-4 h-4 mr-2" />Lista
            </Button>
            <Button variant="outline" onClick={() => rte.getOccurrenceReceiptImage({ billOfLadingId: parseInt(billOfLadingId), occurrenceCode })}>
              <Image className="w-4 h-4 mr-2" />Imagem
            </Button>
          </div>
          {renderResult(rte.occurrenceReceipt)}
          {renderResult(rte.occurrenceReceiptList)}
          {renderResult(rte.occurrenceReceiptImage)}
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div>
            <Label>Protocolos (separados por vírgula)</Label>
            <Input value={batchProtocols} onChange={e => setBatchProtocols(e.target.value)} placeholder="123456, 789012, ..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => rte.getDeliveryReceiptByProtocols({ protocols: batchProtocols.split(',').map(p => p.trim()).filter(Boolean) })}>
              <Download className="w-4 h-4 mr-2" />Baixar por Protocolos
            </Button>
            <Button variant="outline" onClick={() => {
              const protocols = batchProtocols.split(',').map(p => p.trim()).filter(Boolean);
              rte.getDeliveryReceiptBatch({ body: { protocolNumber: protocols } });
            }}>
              <ListOrdered className="w-4 h-4 mr-2" />Download em Lote
            </Button>
          </div>
          {renderResult(rte.deliveryReceiptBatchResult)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

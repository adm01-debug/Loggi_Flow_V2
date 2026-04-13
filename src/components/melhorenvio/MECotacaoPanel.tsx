import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { Calculator, Loader2, Plus, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatCEP } from '@/lib/validations';
import { MECepAutoFill } from './MECepAutoFill';
import { MEQuoteResults } from './MEQuoteResults';
import { MECartDialog } from './MECartDialog';
import type { MEQuotationResult } from './types';

interface Volume {
  width: number; height: number; length: number; weight: number; insurance_value: number; quantity: number;
}

interface CartDialogData {
  service: number; company: { id: number; name: string }; name: string; price: string;
}

const SENDER_INITIAL = {
  name: '', document: '', phone: '', email: '',
  address: '', number: '', complement: '', district: '',
  city: '', state_abbr: '', note: '',
};

export function MECotacaoPanel() {
  const { calcularFrete, inserirCarrinho } = useMelhorEnvio();
  const [cepOrigem, setCepOrigem] = useState('');
  const [cepDestino, setCepDestino] = useState('');
  const [receipt, setReceipt] = useState(false);
  const [ownHand, setOwnHand] = useState(false);
  const [volumes, setVolumes] = useState<Volume[]>([{ width: 20, height: 10, length: 30, weight: 1, insurance_value: 100, quantity: 1 }]);
  const [results, setResults] = useLocalStorage<MEQuotationResult[]>('me-quote-history', []);
  const [cartDialog, setCartDialog] = useState<CartDialogData | null>(null);
  const [senderForm, setSenderForm] = useLocalStorage('me-sender-form', SENDER_INITIAL);

  const addVolume = () => setVolumes([...volumes, { width: 20, height: 10, length: 30, weight: 1, insurance_value: 100, quantity: 1 }]);
  const removeVolume = (i: number) => setVolumes(volumes.filter((_, idx) => idx !== i));
  const updateVolume = (i: number, field: keyof Volume, value: number) => {
    const updated = [...volumes]; updated[i] = { ...updated[i], [field]: value }; setVolumes(updated);
  };

  const handleCalculate = () => {
    const cleanOrigem = cepOrigem.replace(/\D/g, '');
    const cleanDestino = cepDestino.replace(/\D/g, '');
    if (cleanOrigem.length !== 8 || cleanDestino.length !== 8) return;
    calcularFrete.mutate(
      { from: { postal_code: cleanOrigem }, to: { postal_code: cleanDestino }, products: volumes, options: { receipt, own_hand: ownHand } },
      { onSuccess: (data) => { const arr = Array.isArray(data) ? data : []; setResults(arr.filter((r: MEQuotationResult) => !r.error)); } }
    );
  };

  const handleOpenCartDialog = (result: MEQuotationResult) => {
    setCartDialog({ service: result.id, company: result.company ?? { id: 0, name: 'N/A' }, name: result.name, price: result.custom_price || result.price });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" />Cotação de Frete — Melhor Envio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MECepAutoFill value={cepOrigem} onChange={setCepOrigem} label="CEP Origem" onAddressFound={(addr) => { setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, address: addr.rua || p.address, district: addr.bairro || p.district, city: addr.cidade || p.city, state_abbr: addr.uf || p.state_abbr })); }} />
            <MECepAutoFill value={cepDestino} onChange={setCepDestino} label="CEP Destino" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><Switch checked={receipt} onCheckedChange={setReceipt} /><Label>Aviso de Recebimento</Label></div>
            <div className="flex items-center gap-2"><Switch checked={ownHand} onCheckedChange={setOwnHand} /><Label>Mão Própria</Label></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Volumes / Produtos</Label>
              <Button variant="outline" size="sm" onClick={addVolume}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>
            {volumes.map((v, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end p-3 rounded-lg bg-muted/50">
                <div><Label className="text-xs">Largura (cm)</Label><Input type="number" value={v.width} onChange={(e) => updateVolume(i, 'width', +e.target.value)} /></div>
                <div><Label className="text-xs">Altura (cm)</Label><Input type="number" value={v.height} onChange={(e) => updateVolume(i, 'height', +e.target.value)} /></div>
                <div><Label className="text-xs">Comp. (cm)</Label><Input type="number" value={v.length} onChange={(e) => updateVolume(i, 'length', +e.target.value)} /></div>
                <div><Label className="text-xs">Peso (kg)</Label><Input type="number" step="0.1" value={v.weight} onChange={(e) => updateVolume(i, 'weight', +e.target.value)} /></div>
                <div><Label className="text-xs">Valor (R$)</Label><Input type="number" value={v.insurance_value} onChange={(e) => updateVolume(i, 'insurance_value', +e.target.value)} /></div>
                <div><Label className="text-xs">Qtd</Label><Input type="number" value={v.quantity} onChange={(e) => updateVolume(i, 'quantity', +e.target.value)} /></div>
                <Button variant="ghost" size="icon" onClick={() => removeVolume(i)} disabled={volumes.length === 1}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
          <Button onClick={handleCalculate} disabled={calcularFrete.isPending || cepOrigem.replace(/\D/g, '').length !== 8 || cepDestino.replace(/\D/g, '').length !== 8} className="w-full">
            {calcularFrete.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}Calcular Frete
          </Button>
        </CardContent>
      </Card>

      <MEQuoteResults results={results} onClearHistory={() => setResults([])} onOpenCartDialog={handleOpenCartDialog} />

      <MECartDialog
        cartDialog={cartDialog}
        onClose={() => setCartDialog(null)}
        senderForm={senderForm}
        setSenderForm={setSenderForm}
        cepOrigem={cepOrigem}
        cepDestino={cepDestino}
        volumes={volumes}
        receipt={receipt}
        ownHand={ownHand}
        onAddToCart={(params) => inserirCarrinho.mutate(params as Parameters<typeof inserirCarrinho.mutate>[0], { onSuccess: () => setCartDialog(null) })}
        isInserting={inserirCarrinho.isPending}
      />
    </div>
  );
}

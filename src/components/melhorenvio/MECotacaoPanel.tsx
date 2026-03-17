import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { Calculator, Loader2, Clock, DollarSign, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatCEP, formatCPFCNPJ, formatPhone, isValidEmail, isValidPhone } from '@/lib/validations';
import { MECepAutoFill } from './MECepAutoFill';
import { MEFormField } from './MEFormField';
import { DataExporter } from '@/components/common/DataExporter';
import type { MEQuotationResult } from './types';

interface Volume {
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

interface CartDialogData {
  service: number;
  company: { id: number; name: string };
  name: string;
  price: string;
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
  const [volumes, setVolumes] = useState<Volume[]>([
    { width: 20, height: 10, length: 30, weight: 1, insurance_value: 100, quantity: 1 },
  ]);
  const [results, setResults] = useLocalStorage<MEQuotationResult[]>('me-quote-history', []);
  const [cartDialog, setCartDialog] = useState<CartDialogData | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const [senderForm, setSenderForm] = useLocalStorage('me-sender-form', SENDER_INITIAL);

  const [cartForm, setCartForm] = useState({
    name: '', document: '', phone: '', email: '',
    address: '', number: '', complement: '', district: '',
    city: '', state_abbr: '', postal_code: '', note: '',
  });

  const addVolume = () => {
    setVolumes([...volumes, { width: 20, height: 10, length: 30, weight: 1, insurance_value: 100, quantity: 1 }]);
  };

  const removeVolume = (i: number) => {
    setVolumes(volumes.filter((_, idx) => idx !== i));
  };

  const updateVolume = (i: number, field: keyof Volume, value: number) => {
    const updated = [...volumes];
    updated[i] = { ...updated[i], [field]: value };
    setVolumes(updated);
  };

  const handleCalculate = () => {
    const cleanOrigem = cepOrigem.replace(/\D/g, '');
    const cleanDestino = cepDestino.replace(/\D/g, '');
    if (cleanOrigem.length !== 8 || cleanDestino.length !== 8) return;

    calcularFrete.mutate(
      {
        from: { postal_code: cleanOrigem },
        to: { postal_code: cleanDestino },
        products: volumes,
        options: { receipt, own_hand: ownHand },
      },
      {
        onSuccess: (data) => {
          const arr = Array.isArray(data) ? data : [];
          setResults(arr.filter((r: MEQuotationResult) => !r.error));
        },
      }
    );
  };

  const handleOpenCartDialog = (result: MEQuotationResult) => {
    setCartDialog({
      service: result.id,
      company: result.company ?? { id: 0, name: 'N/A' },
      name: result.name,
      price: result.custom_price || result.price,
    });
    setCartForm(prev => ({
      ...prev,
      postal_code: formatCEP(cepDestino.replace(/\D/g, '')),
    }));
    setFormErrors({});
    setSubmitted(false);
  };

  const validateCartForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!senderForm.name.trim()) errors['sender_name'] = 'Nome do remetente é obrigatório';
    if (!senderForm.document.trim()) errors['sender_document'] = 'CPF/CNPJ é obrigatório';
    if (!senderForm.address.trim()) errors['sender_address'] = 'Endereço é obrigatório';
    if (!senderForm.number.trim()) errors['sender_number'] = 'Número é obrigatório';
    if (!senderForm.district.trim()) errors['sender_district'] = 'Bairro é obrigatório';
    if (!senderForm.city.trim()) errors['sender_city'] = 'Cidade é obrigatória';
    if (!senderForm.state_abbr.trim()) errors['sender_state'] = 'UF é obrigatória';
    if (senderForm.email && !isValidEmail(senderForm.email)) errors['sender_email'] = 'Email inválido';
    if (senderForm.phone && !isValidPhone(senderForm.phone)) errors['sender_phone'] = 'Telefone inválido';

    if (!cartForm.name.trim()) errors['to_name'] = 'Nome do destinatário é obrigatório';
    if (!cartForm.document.trim()) errors['to_document'] = 'CPF/CNPJ é obrigatório';
    if (!cartForm.postal_code.trim()) errors['to_postal_code'] = 'CEP é obrigatório';
    if (!cartForm.address.trim()) errors['to_address'] = 'Endereço é obrigatório';
    if (!cartForm.number.trim()) errors['to_number'] = 'Número é obrigatório';
    if (!cartForm.district.trim()) errors['to_district'] = 'Bairro é obrigatório';
    if (!cartForm.city.trim()) errors['to_city'] = 'Cidade é obrigatória';
    if (!cartForm.state_abbr.trim()) errors['to_state'] = 'UF é obrigatória';
    if (cartForm.email && !isValidEmail(cartForm.email)) errors['to_email'] = 'Email inválido';
    if (cartForm.phone && !isValidPhone(cartForm.phone)) errors['to_phone'] = 'Telefone inválido';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddToCart = () => {
    setSubmitted(true);
    if (!cartDialog || !validateCartForm()) return;
    inserirCarrinho.mutate({
      service: cartDialog.service,
      from: {
        name: senderForm.name,
        document: senderForm.document.replace(/\D/g, ''),
        phone: senderForm.phone.replace(/\D/g, ''),
        email: senderForm.email,
        address: senderForm.address,
        number: senderForm.number,
        complement: senderForm.complement,
        district: senderForm.district,
        city: senderForm.city,
        state_abbr: senderForm.state_abbr,
        postal_code: cepOrigem.replace(/\D/g, ''),
        note: senderForm.note,
      },
      to: {
        name: cartForm.name,
        document: cartForm.document.replace(/\D/g, ''),
        phone: cartForm.phone.replace(/\D/g, ''),
        email: cartForm.email,
        address: cartForm.address,
        number: cartForm.number,
        complement: cartForm.complement,
        district: cartForm.district,
        city: cartForm.city,
        state_abbr: cartForm.state_abbr,
        postal_code: cartForm.postal_code.replace(/\D/g, ''),
        note: cartForm.note,
      },
      products: volumes.map(v => ({
        width: v.width,
        height: v.height,
        length: v.length,
        weight: v.weight,
        insurance_value: v.insurance_value,
        quantity: v.quantity,
      })),
      options: {
        receipt,
        own_hand: ownHand,
        insurance_value: volumes.reduce((sum, v) => sum + v.insurance_value * v.quantity, 0),
      },
    }, {
      onSuccess: () => setCartDialog(null),
    });
  };

  const bestPrice = results.length > 0 ? Math.min(...results.map((r) => parseFloat(r.custom_price || r.price || '999999'))) : null;
  const bestDeadline = results.length > 0 ? Math.min(...results.map((r) => r.delivery_time || 999)) : null;

  const exportColumns = [
    { key: 'name' as const, label: 'Serviço' },
    { key: 'price' as const, label: 'Preço' },
    { key: 'delivery_time' as const, label: 'Prazo (dias)' },
    { key: 'discount' as const, label: 'Desconto' },
  ];

  const exportData = results.map(r => ({
    name: `${r.company?.name || ''} - ${r.name}`,
    price: `R$ ${parseFloat(r.custom_price || r.price || '0').toFixed(2)}`,
    delivery_time: r.delivery_time || '-',
    discount: r.discount ? `R$ ${r.discount}` : '-',
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Cotação de Frete — Melhor Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MECepAutoFill
              value={cepOrigem}
              onChange={setCepOrigem}
              label="CEP Origem"
              onAddressFound={(addr) => {
                setSenderForm((p: typeof SENDER_INITIAL) => ({
                  ...p,
                  address: addr.rua || p.address,
                  district: addr.bairro || p.district,
                  city: addr.cidade || p.city,
                  state_abbr: addr.uf || p.state_abbr,
                }));
              }}
            />
            <MECepAutoFill
              value={cepDestino}
              onChange={setCepDestino}
              label="CEP Destino"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={receipt} onCheckedChange={setReceipt} />
              <Label>Aviso de Recebimento</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={ownHand} onCheckedChange={setOwnHand} />
              <Label>Mão Própria</Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Volumes / Produtos</Label>
              <Button variant="outline" size="sm" onClick={addVolume}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>

            {volumes.map((v, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end p-3 rounded-lg bg-muted/50">
                <div>
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input type="number" value={v.width} onChange={(e) => updateVolume(i, 'width', +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input type="number" value={v.height} onChange={(e) => updateVolume(i, 'height', +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Comp. (cm)</Label>
                  <Input type="number" value={v.length} onChange={(e) => updateVolume(i, 'length', +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input type="number" step="0.1" value={v.weight} onChange={(e) => updateVolume(i, 'weight', +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input type="number" value={v.insurance_value} onChange={(e) => updateVolume(i, 'insurance_value', +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Qtd</Label>
                  <Input type="number" value={v.quantity} onChange={(e) => updateVolume(i, 'quantity', +e.target.value)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeVolume(i)} disabled={volumes.length === 1}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleCalculate}
            disabled={calcularFrete.isPending || cepOrigem.replace(/\D/g, '').length !== 8 || cepDestino.replace(/\D/g, '').length !== 8}
            className="w-full"
          >
            {calcularFrete.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
            Calcular Frete
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{results.length} resultado(s) — histórico salvo localmente</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResults([])}>Limpar histórico</Button>
              <DataExporter data={exportData} filename="cotacoes-melhor-envio" columns={exportColumns} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, i) => {
              const price = parseFloat(r.custom_price || r.price || '0');
              const isBestPrice = price === bestPrice;
              const isBestDeadline = r.delivery_time === bestDeadline;

              return (
                <Card key={i} className={isBestPrice ? 'border-primary ring-1 ring-primary/30' : ''}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{r.company?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{r.name || 'N/A'}</p>
                      </div>
                      <div className="flex gap-1">
                        {isBestPrice && <Badge variant="default" className="text-xs"><DollarSign className="w-3 h-3 mr-1" />Menor preço</Badge>}
                        {isBestDeadline && <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Mais rápido</Badge>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Preço:</span>
                        <span className="ml-1 font-bold text-primary">R$ {price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prazo:</span>
                        <span className="ml-1 font-semibold">{r.delivery_time || '-'} dias</span>
                      </div>
                      {r.discount && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Desconto:</span>
                          <span className="ml-1 text-accent-foreground">R$ {r.discount}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenCartDialog(r)}>
                      <ShoppingCart className="w-4 h-4 mr-1" /> Adicionar ao Carrinho
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!cartDialog} onOpenChange={() => setCartDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Adicionar ao Carrinho
            </DialogTitle>
          </DialogHeader>
          {cartDialog && (
            <div className="space-y-1 text-sm mb-2">
              <p><span className="text-muted-foreground">Serviço:</span> {cartDialog.company?.name} — {cartDialog.name}</p>
              <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-primary">R$ {cartDialog.price}</span></p>
            </div>
          )}

          <div className="space-y-2">
            <p className="font-semibold text-sm border-b pb-1">📦 Remetente (Origem)</p>
            <div className="grid grid-cols-2 gap-3">
              <MEFormField label="Nome" required error={submitted ? formErrors['sender_name'] : undefined} className="col-span-2">
                <Input value={senderForm.name} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, name: e.target.value }))} className={submitted && formErrors['sender_name'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="CPF/CNPJ" required error={submitted ? formErrors['sender_document'] : undefined}>
                <Input value={senderForm.document} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, document: formatCPFCNPJ(e.target.value) }))} placeholder="000.000.000-00" className={submitted && formErrors['sender_document'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Telefone" error={submitted ? formErrors['sender_phone'] : undefined}>
                <Input value={senderForm.phone} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, phone: formatPhone(e.target.value) }))} placeholder="(99) 99999-9999" className={submitted && formErrors['sender_phone'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Email" error={submitted ? formErrors['sender_email'] : undefined} className="col-span-2">
                <Input type="email" value={senderForm.email} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className={submitted && formErrors['sender_email'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="UF" required error={submitted ? formErrors['sender_state'] : undefined}>
                <Input value={senderForm.state_abbr} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, state_abbr: e.target.value.toUpperCase() }))} maxLength={2} className={submitted && formErrors['sender_state'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="CEP">
                <Input value={cepOrigem} disabled className="bg-muted" />
              </MEFormField>
              <MEFormField label="Endereço" required error={submitted ? formErrors['sender_address'] : undefined} className="col-span-2">
                <Input value={senderForm.address} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, address: e.target.value }))} className={submitted && formErrors['sender_address'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Número" required error={submitted ? formErrors['sender_number'] : undefined}>
                <Input value={senderForm.number} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, number: e.target.value }))} className={submitted && formErrors['sender_number'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Complemento">
                <Input value={senderForm.complement} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, complement: e.target.value }))} />
              </MEFormField>
              <MEFormField label="Bairro" required error={submitted ? formErrors['sender_district'] : undefined}>
                <Input value={senderForm.district} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, district: e.target.value }))} className={submitted && formErrors['sender_district'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Cidade" required error={submitted ? formErrors['sender_city'] : undefined}>
                <Input value={senderForm.city} onChange={(e) => setSenderForm((p: typeof SENDER_INITIAL) => ({ ...p, city: e.target.value }))} className={submitted && formErrors['sender_city'] ? 'border-destructive' : ''} />
              </MEFormField>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm border-b pb-1">📍 Destinatário</p>
            <div className="grid grid-cols-2 gap-3">
              <MEFormField label="Nome" required error={submitted ? formErrors['to_name'] : undefined} className="col-span-2">
                <Input value={cartForm.name} onChange={(e) => setCartForm(p => ({ ...p, name: e.target.value }))} className={submitted && formErrors['to_name'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="CPF/CNPJ" required error={submitted ? formErrors['to_document'] : undefined}>
                <Input value={cartForm.document} onChange={(e) => setCartForm(p => ({ ...p, document: formatCPFCNPJ(e.target.value) }))} placeholder="000.000.000-00" className={submitted && formErrors['to_document'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Telefone" error={submitted ? formErrors['to_phone'] : undefined}>
                <Input value={cartForm.phone} onChange={(e) => setCartForm(p => ({ ...p, phone: formatPhone(e.target.value) }))} placeholder="(99) 99999-9999" className={submitted && formErrors['to_phone'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Email" error={submitted ? formErrors['to_email'] : undefined} className="col-span-2">
                <Input type="email" value={cartForm.email} onChange={(e) => setCartForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className={submitted && formErrors['to_email'] ? 'border-destructive' : ''} />
              </MEFormField>
              <div>
                <MECepAutoFill
                  value={cartForm.postal_code}
                  onChange={(v) => setCartForm(p => ({ ...p, postal_code: v }))}
                  label="CEP *"
                  onAddressFound={(addr) => {
                    setCartForm(p => ({
                      ...p,
                      address: addr.rua || p.address,
                      district: addr.bairro || p.district,
                      city: addr.cidade || p.city,
                      state_abbr: addr.uf || p.state_abbr,
                    }));
                  }}
                />
                {submitted && formErrors['to_postal_code'] && <p className="text-xs text-destructive mt-1">{formErrors['to_postal_code']}</p>}
              </div>
              <MEFormField label="UF" required error={submitted ? formErrors['to_state'] : undefined}>
                <Input value={cartForm.state_abbr} onChange={(e) => setCartForm(p => ({ ...p, state_abbr: e.target.value.toUpperCase() }))} maxLength={2} className={submitted && formErrors['to_state'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Endereço" required error={submitted ? formErrors['to_address'] : undefined} className="col-span-2">
                <Input value={cartForm.address} onChange={(e) => setCartForm(p => ({ ...p, address: e.target.value }))} className={submitted && formErrors['to_address'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Número" required error={submitted ? formErrors['to_number'] : undefined}>
                <Input value={cartForm.number} onChange={(e) => setCartForm(p => ({ ...p, number: e.target.value }))} className={submitted && formErrors['to_number'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Complemento">
                <Input value={cartForm.complement} onChange={(e) => setCartForm(p => ({ ...p, complement: e.target.value }))} />
              </MEFormField>
              <MEFormField label="Bairro" required error={submitted ? formErrors['to_district'] : undefined}>
                <Input value={cartForm.district} onChange={(e) => setCartForm(p => ({ ...p, district: e.target.value }))} className={submitted && formErrors['to_district'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Cidade" required error={submitted ? formErrors['to_city'] : undefined}>
                <Input value={cartForm.city} onChange={(e) => setCartForm(p => ({ ...p, city: e.target.value }))} className={submitted && formErrors['to_city'] ? 'border-destructive' : ''} />
              </MEFormField>
              <MEFormField label="Observações" className="col-span-2">
                <Input value={cartForm.note} onChange={(e) => setCartForm(p => ({ ...p, note: e.target.value }))} />
              </MEFormField>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCartDialog(null)}>Cancelar</Button>
            <Button onClick={handleAddToCart} disabled={inserirCarrinho.isPending}>
              {inserirCarrinho.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-1" />}
              Inserir no Carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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

export function MECotacaoPanel() {
  const { calcularFrete, inserirCarrinho } = useMelhorEnvio();
  const [cepOrigem, setCepOrigem] = useState('');
  const [cepDestino, setCepDestino] = useState('');
  const [receipt, setReceipt] = useState(false);
  const [ownHand, setOwnHand] = useState(false);
  const [volumes, setVolumes] = useState<Volume[]>([
    { width: 20, height: 10, length: 30, weight: 1, insurance_value: 100, quantity: 1 },
  ]);
  const [results, setResults] = useState<any[]>([]);
  const [cartDialog, setCartDialog] = useState<CartDialogData | null>(null);

  // Sender form fields
  const [senderForm, setSenderForm] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state_abbr: '',
    note: '',
  });

  // Recipient form fields
  const [cartForm, setCartForm] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state_abbr: '',
    postal_code: '',
    note: '',
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
    calcularFrete.mutate(
      {
        from: { postal_code: cepOrigem.replace(/\D/g, '') },
        to: { postal_code: cepDestino.replace(/\D/g, '') },
        products: volumes,
        options: { receipt, own_hand: ownHand },
      },
      {
        onSuccess: (data) => {
          const arr = Array.isArray(data) ? data : [];
          setResults(arr.filter((r: any) => !r.error));
        },
      }
    );
  };

  const handleOpenCartDialog = (result: any) => {
    setCartDialog({
      service: result.id,
      company: result.company,
      name: result.name,
      price: result.custom_price || result.price,
    });
    setCartForm(prev => ({
      ...prev,
      postal_code: cepDestino.replace(/\D/g, ''),
    }));
  };

  const handleAddToCart = () => {
    if (!cartDialog) return;
    inserirCarrinho.mutate({
      service: cartDialog.service,
      from: {
        name: senderForm.name,
        document: senderForm.document,
        phone: senderForm.phone,
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
        document: cartForm.document,
        phone: cartForm.phone,
        email: cartForm.email,
        address: cartForm.address,
        number: cartForm.number,
        complement: cartForm.complement,
        district: cartForm.district,
        city: cartForm.city,
        state_abbr: cartForm.state_abbr,
        postal_code: cartForm.postal_code,
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
            <div>
              <Label>CEP Origem</Label>
              <Input placeholder="09831-510" value={cepOrigem} onChange={(e) => setCepOrigem(e.target.value)} />
            </div>
            <div>
              <Label>CEP Destino</Label>
              <Input placeholder="01001-000" value={cepDestino} onChange={(e) => setCepDestino(e.target.value)} />
            </div>
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

          <Button onClick={handleCalculate} disabled={calcularFrete.isPending || !cepOrigem || !cepDestino} className="w-full">
            {calcularFrete.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
            Calcular Frete
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((r: any, i: number) => {
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenCartDialog(r)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" /> Adicionar ao Carrinho
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog para preencher dados do remetente e destinatário antes de inserir no carrinho */}
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

          {/* Remetente */}
          <div className="space-y-2">
            <p className="font-semibold text-sm border-b pb-1">📦 Remetente (Origem)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome *</Label><Input value={senderForm.name} onChange={(e) => setSenderForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>CPF/CNPJ *</Label><Input value={senderForm.document} onChange={(e) => setSenderForm(p => ({ ...p, document: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={senderForm.phone} onChange={(e) => setSenderForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Email</Label><Input type="email" value={senderForm.email} onChange={(e) => setSenderForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>UF *</Label><Input value={senderForm.state_abbr} onChange={(e) => setSenderForm(p => ({ ...p, state_abbr: e.target.value }))} maxLength={2} /></div>
              <div><Label>CEP</Label><Input value={cepOrigem} disabled className="bg-muted" /></div>
              <div className="col-span-2"><Label>Endereço *</Label><Input value={senderForm.address} onChange={(e) => setSenderForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>Número *</Label><Input value={senderForm.number} onChange={(e) => setSenderForm(p => ({ ...p, number: e.target.value }))} /></div>
              <div><Label>Complemento</Label><Input value={senderForm.complement} onChange={(e) => setSenderForm(p => ({ ...p, complement: e.target.value }))} /></div>
              <div><Label>Bairro *</Label><Input value={senderForm.district} onChange={(e) => setSenderForm(p => ({ ...p, district: e.target.value }))} /></div>
              <div><Label>Cidade *</Label><Input value={senderForm.city} onChange={(e) => setSenderForm(p => ({ ...p, city: e.target.value }))} /></div>
            </div>
          </div>

          {/* Destinatário */}
          <div className="space-y-2">
            <p className="font-semibold text-sm border-b pb-1">📍 Destinatário</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome *</Label><Input value={cartForm.name} onChange={(e) => setCartForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>CPF/CNPJ *</Label><Input value={cartForm.document} onChange={(e) => setCartForm(p => ({ ...p, document: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={cartForm.phone} onChange={(e) => setCartForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Email</Label><Input type="email" value={cartForm.email} onChange={(e) => setCartForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>CEP *</Label><Input value={cartForm.postal_code} onChange={(e) => setCartForm(p => ({ ...p, postal_code: e.target.value }))} /></div>
              <div><Label>UF *</Label><Input value={cartForm.state_abbr} onChange={(e) => setCartForm(p => ({ ...p, state_abbr: e.target.value }))} maxLength={2} /></div>
              <div className="col-span-2"><Label>Endereço *</Label><Input value={cartForm.address} onChange={(e) => setCartForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>Número *</Label><Input value={cartForm.number} onChange={(e) => setCartForm(p => ({ ...p, number: e.target.value }))} /></div>
              <div><Label>Complemento</Label><Input value={cartForm.complement} onChange={(e) => setCartForm(p => ({ ...p, complement: e.target.value }))} /></div>
              <div><Label>Bairro *</Label><Input value={cartForm.district} onChange={(e) => setCartForm(p => ({ ...p, district: e.target.value }))} /></div>
              <div><Label>Cidade *</Label><Input value={cartForm.city} onChange={(e) => setCartForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Observações</Label><Input value={cartForm.note} onChange={(e) => setCartForm(p => ({ ...p, note: e.target.value }))} /></div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCartDialog(null)}>Cancelar</Button>
            <Button onClick={handleAddToCart} disabled={inserirCarrinho.isPending || !cartForm.name || !cartForm.postal_code || !senderForm.name}>
              {inserirCarrinho.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-1" />}
              Inserir no Carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

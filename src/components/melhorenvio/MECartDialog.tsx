import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ShoppingCart } from 'lucide-react';
import { formatCPFCNPJ, formatPhone, isValidEmail, isValidPhone } from '@/lib/validations';
import { MECepAutoFill } from './MECepAutoFill';
import { MEFormField } from './MEFormField';

interface CartDialogData {
  service: number;
  company: { id: number; name: string };
  name: string;
  price: string;
}

interface SenderForm {
  name: string; document: string; phone: string; email: string;
  address: string; number: string; complement: string; district: string;
  city: string; state_abbr: string; note: string;
}

interface MECartDialogProps {
  cartDialog: CartDialogData | null;
  onClose: () => void;
  senderForm: SenderForm;
  setSenderForm: (fn: (prev: SenderForm) => SenderForm) => void;
  cepOrigem: string;
  cepDestino: string;
  volumes: Array<{ width: number; height: number; length: number; weight: number; insurance_value: number; quantity: number }>;
  receipt: boolean;
  ownHand: boolean;
  onAddToCart: (params: {
    service: number;
    from: Record<string, string>;
    to: Record<string, string>;
    products: Array<Record<string, number>>;
    options: Record<string, boolean | number>;
  }) => void;
  isInserting: boolean;
}

export function MECartDialog({
  cartDialog, onClose, senderForm, setSenderForm,
  cepOrigem, cepDestino, volumes, receipt, ownHand, onAddToCart, isInserting,
}: MECartDialogProps) {
  const [cartForm, setCartForm] = useState({
    name: '', document: '', phone: '', email: '',
    address: '', number: '', complement: '', district: '',
    city: '', state_abbr: '', postal_code: formatCEPValue(cepDestino), note: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function formatCEPValue(cep: string) {
    const clean = cep.replace(/\D/g, '');
    return clean.length === 8 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : cep;
  }

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
    onAddToCart({
      service: cartDialog.service,
      from: {
        name: senderForm.name, document: senderForm.document.replace(/\D/g, ''),
        phone: senderForm.phone.replace(/\D/g, ''), email: senderForm.email,
        address: senderForm.address, number: senderForm.number, complement: senderForm.complement,
        district: senderForm.district, city: senderForm.city, state_abbr: senderForm.state_abbr,
        postal_code: cepOrigem.replace(/\D/g, ''), note: senderForm.note,
      },
      to: {
        name: cartForm.name, document: cartForm.document.replace(/\D/g, ''),
        phone: cartForm.phone.replace(/\D/g, ''), email: cartForm.email,
        address: cartForm.address, number: cartForm.number, complement: cartForm.complement,
        district: cartForm.district, city: cartForm.city, state_abbr: cartForm.state_abbr,
        postal_code: cartForm.postal_code.replace(/\D/g, ''), note: cartForm.note,
      },
      products: volumes.map(v => ({ width: v.width, height: v.height, length: v.length, weight: v.weight, insurance_value: v.insurance_value, quantity: v.quantity })),
      options: { receipt, own_hand: ownHand, insurance_value: volumes.reduce((sum, v) => sum + v.insurance_value * v.quantity, 0) },
    });
  };

  return (
    <Dialog open={!!cartDialog} onOpenChange={() => onClose()}>
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
              <Input value={senderForm.name} onChange={(e) => setSenderForm((p) => ({ ...p, name: e.target.value }))} className={submitted && formErrors['sender_name'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="CPF/CNPJ" required error={submitted ? formErrors['sender_document'] : undefined}>
              <Input value={senderForm.document} onChange={(e) => setSenderForm((p) => ({ ...p, document: formatCPFCNPJ(e.target.value) }))} placeholder="000.000.000-00" className={submitted && formErrors['sender_document'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="Telefone" error={submitted ? formErrors['sender_phone'] : undefined}>
              <Input value={senderForm.phone} onChange={(e) => setSenderForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))} placeholder="(99) 99999-9999" className={submitted && formErrors['sender_phone'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="Email" error={submitted ? formErrors['sender_email'] : undefined} className="col-span-2">
              <Input type="email" value={senderForm.email} onChange={(e) => setSenderForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className={submitted && formErrors['sender_email'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="UF" required error={submitted ? formErrors['sender_state'] : undefined}>
              <Input value={senderForm.state_abbr} onChange={(e) => setSenderForm((p) => ({ ...p, state_abbr: e.target.value.toUpperCase() }))} maxLength={2} className={submitted && formErrors['sender_state'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="CEP">
              <Input value={cepOrigem} disabled className="bg-muted" />
            </MEFormField>
            <MEFormField label="Endereço" required error={submitted ? formErrors['sender_address'] : undefined} className="col-span-2">
              <Input value={senderForm.address} onChange={(e) => setSenderForm((p) => ({ ...p, address: e.target.value }))} className={submitted && formErrors['sender_address'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="Número" required error={submitted ? formErrors['sender_number'] : undefined}>
              <Input value={senderForm.number} onChange={(e) => setSenderForm((p) => ({ ...p, number: e.target.value }))} className={submitted && formErrors['sender_number'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="Complemento">
              <Input value={senderForm.complement} onChange={(e) => setSenderForm((p) => ({ ...p, complement: e.target.value }))} />
            </MEFormField>
            <MEFormField label="Bairro" required error={submitted ? formErrors['sender_district'] : undefined}>
              <Input value={senderForm.district} onChange={(e) => setSenderForm((p) => ({ ...p, district: e.target.value }))} className={submitted && formErrors['sender_district'] ? 'border-destructive' : ''} />
            </MEFormField>
            <MEFormField label="Cidade" required error={submitted ? formErrors['sender_city'] : undefined}>
              <Input value={senderForm.city} onChange={(e) => setSenderForm((p) => ({ ...p, city: e.target.value }))} className={submitted && formErrors['sender_city'] ? 'border-destructive' : ''} />
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
                  setCartForm(p => ({ ...p, address: addr.rua || p.address, district: addr.bairro || p.district, city: addr.cidade || p.city, state_abbr: addr.uf || p.state_abbr }));
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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAddToCart} disabled={isInserting}>
            {isInserting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-1" />}
            Inserir no Carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

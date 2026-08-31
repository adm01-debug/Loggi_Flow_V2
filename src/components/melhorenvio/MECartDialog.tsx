import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ShoppingCart } from "lucide-react";
import { MEAddressBlock } from "./MEAddressBlock";
import {
  validateCartForms,
  type AddressFormValues,
} from "./MECartValidation";

interface CartDialogData {
  service: number;
  company: { id: number; name: string };
  name: string;
  price: string;
}

type SenderForm = AddressFormValues;

interface MECartDialogProps {
  cartDialog: CartDialogData | null;
  onClose: () => void;
  senderForm: SenderForm;
  setSenderForm: (fn: (prev: SenderForm) => SenderForm) => void;
  cepOrigem: string;
  cepDestino: string;
  volumes: Array<{
    width: number;
    height: number;
    length: number;
    weight: number;
    insurance_value: number;
    quantity: number;
  }>;
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

function formatCEPValue(cep: string) {
  const clean = cep.replace(/\D/g, "");
  return clean.length === 8 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : cep;
}

function emptyReceiverForm(cepDestino: string): AddressFormValues {
  return {
    name: "",
    document: "",
    phone: "",
    email: "",
    address: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state_abbr: "",
    postal_code: formatCEPValue(cepDestino),
    note: "",
  };
}

export function MECartDialog({
  cartDialog,
  onClose,
  senderForm,
  setSenderForm,
  cepOrigem,
  cepDestino,
  volumes,
  receipt,
  ownHand,
  onAddToCart,
  isInserting,
}: MECartDialogProps) {
  const [cartForm, setCartForm] = useState<AddressFormValues>(() =>
    emptyReceiverForm(cepDestino),
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!cartDialog) return;
    setCartForm(emptyReceiverForm(cepDestino));
    setFormErrors({});
    setSubmitted(false);
  }, [cartDialog, cepDestino]);

  const handleAddToCart = () => {
    setSubmitted(true);
    if (!cartDialog) return;
    const errors = validateCartForms(senderForm, cartForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onAddToCart({
      service: cartDialog.service,
      from: {
        name: senderForm.name,
        document: senderForm.document.replace(/\D/g, ""),
        phone: senderForm.phone.replace(/\D/g, ""),
        email: senderForm.email,
        address: senderForm.address,
        number: senderForm.number,
        complement: senderForm.complement,
        district: senderForm.district,
        city: senderForm.city,
        state_abbr: senderForm.state_abbr,
        postal_code: cepOrigem.replace(/\D/g, ""),
        note: senderForm.note,
      },
      to: {
        name: cartForm.name,
        document: cartForm.document.replace(/\D/g, ""),
        phone: cartForm.phone.replace(/\D/g, ""),
        email: cartForm.email,
        address: cartForm.address,
        number: cartForm.number,
        complement: cartForm.complement,
        district: cartForm.district,
        city: cartForm.city,
        state_abbr: cartForm.state_abbr,
        postal_code: (cartForm.postal_code ?? "").replace(/\D/g, ""),
        note: cartForm.note,
      },
      products: volumes.map((v) => ({
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
        insurance_value: volumes.reduce(
          (sum, v) => sum + v.insurance_value * v.quantity,
          0,
        ),
      },
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
            <p>
              <span className="text-muted-foreground">Serviço:</span>{" "}
              {cartDialog.company?.name} — {cartDialog.name}
            </p>
            <p>
              <span className="text-muted-foreground">Valor:</span>{" "}
              <span className="font-bold text-primary">
                R$ {cartDialog.price}
              </span>
            </p>
          </div>
        )}

        <MEAddressBlock
          title="📦 Remetente (Origem)"
          form={senderForm}
          setForm={setSenderForm}
          errors={formErrors}
          submitted={submitted}
          prefix="sender"
          cep={{ mode: "readonly", value: cepOrigem }}
        />

        <MEAddressBlock
          title="📍 Destinatário"
          form={cartForm}
          setForm={setCartForm}
          errors={formErrors}
          submitted={submitted}
          prefix="to"
          cep={{
            mode: "autofill",
            value: cartForm.postal_code ?? "",
            onChange: (v) => setCartForm((p) => ({ ...p, postal_code: v })),
          }}
          showNote
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAddToCart} disabled={isInserting}>
            {isInserting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-1" />
            )}
            Inserir no Carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Input } from "@/components/ui/input";
import { formatCPFCNPJ, formatPhone } from "@/lib/validations";
import { MECepAutoFill } from "./MECepAutoFill";
import { MEFormField } from "./MEFormField";
import type { AddressFormValues } from "./MECartValidation";

type Updater = (fn: (prev: AddressFormValues) => AddressFormValues) => void;

interface CepConfig {
  mode: "readonly" | "autofill";
  value: string;
  onChange?: (v: string) => void;
}

interface MEAddressBlockProps {
  title: string;
  form: AddressFormValues;
  setForm: Updater;
  errors: Record<string, string>;
  submitted: boolean;
  prefix: "sender" | "to";
  cep: CepConfig;
  showNote?: boolean;
}

function errClass(show: boolean) {
  return show ? "border-destructive" : "";
}

export function MEAddressBlock({
  title,
  form,
  setForm,
  errors,
  submitted,
  prefix,
  cep,
  showNote,
}: MEAddressBlockProps) {
  const err = (key: string) => (submitted ? errors[`${prefix}_${key}`] : undefined);
  const set = <K extends keyof AddressFormValues>(k: K, v: AddressFormValues[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-2">
      <p className="font-semibold text-sm border-b pb-1">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <MEFormField label="Nome" required error={err("name")} className="col-span-2">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={errClass(!!err("name"))}
          />
        </MEFormField>
        <MEFormField label="CPF/CNPJ" required error={err("document")}>
          <Input
            value={form.document}
            onChange={(e) => set("document", formatCPFCNPJ(e.target.value))}
            placeholder="000.000.000-00"
            className={errClass(!!err("document"))}
          />
        </MEFormField>
        <MEFormField label="Telefone" error={err("phone")}>
          <Input
            value={form.phone}
            onChange={(e) => set("phone", formatPhone(e.target.value))}
            placeholder="(99) 99999-9999"
            className={errClass(!!err("phone"))}
          />
        </MEFormField>
        <MEFormField label="Email" error={err("email")} className="col-span-2">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="email@exemplo.com"
            className={errClass(!!err("email"))}
          />
        </MEFormField>
        {cep.mode === "readonly" ? (
          <>
            <MEFormField label="UF" required error={err("state")}>
              <Input
                value={form.state_abbr}
                onChange={(e) => set("state_abbr", e.target.value.toUpperCase())}
                maxLength={2}
                className={errClass(!!err("state"))}
              />
            </MEFormField>
            <MEFormField label="CEP">
              <Input value={cep.value} disabled className="bg-muted" />
            </MEFormField>
          </>
        ) : (
          <>
            <div>
              <MECepAutoFill
                value={cep.value}
                onChange={(v) => cep.onChange?.(v)}
                label="CEP *"
                onAddressFound={(addr) => {
                  setForm((p) => ({
                    ...p,
                    address: addr.rua || p.address,
                    district: addr.bairro || p.district,
                    city: addr.cidade || p.city,
                    state_abbr: addr.uf || p.state_abbr,
                  }));
                }}
              />
              {err("postal_code") && (
                <p className="text-xs text-destructive mt-1">{err("postal_code")}</p>
              )}
            </div>
            <MEFormField label="UF" required error={err("state")}>
              <Input
                value={form.state_abbr}
                onChange={(e) => set("state_abbr", e.target.value.toUpperCase())}
                maxLength={2}
                className={errClass(!!err("state"))}
              />
            </MEFormField>
          </>
        )}
        <MEFormField label="Endereço" required error={err("address")} className="col-span-2">
          <Input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className={errClass(!!err("address"))}
          />
        </MEFormField>
        <MEFormField label="Número" required error={err("number")}>
          <Input
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            className={errClass(!!err("number"))}
          />
        </MEFormField>
        <MEFormField label="Complemento">
          <Input
            value={form.complement}
            onChange={(e) => set("complement", e.target.value)}
          />
        </MEFormField>
        <MEFormField label="Bairro" required error={err("district")}>
          <Input
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
            className={errClass(!!err("district"))}
          />
        </MEFormField>
        <MEFormField label="Cidade" required error={err("city")}>
          <Input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className={errClass(!!err("city"))}
          />
        </MEFormField>
        {showNote && (
          <MEFormField label="Observações" className="col-span-2">
            <Input
              value={form.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
            />
          </MEFormField>
        )}
      </div>
    </div>
  );
}

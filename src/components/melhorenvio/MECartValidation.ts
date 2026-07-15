import { isValidEmail, isValidPhone } from "@/lib/validations";

export interface AddressFormValues {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state_abbr: string;
  postal_code?: string;
  note?: string;
}

interface FieldRule {
  key: keyof AddressFormValues;
  required?: boolean;
  message: string;
  validate?: (v: string) => boolean;
}

const REQUIRED_TEXT_RULES: Array<Omit<FieldRule, "validate">> = [
  { key: "name", required: true, message: "Nome é obrigatório" },
  { key: "document", required: true, message: "CPF/CNPJ é obrigatório" },
  { key: "address", required: true, message: "Endereço é obrigatório" },
  { key: "number", required: true, message: "Número é obrigatório" },
  { key: "district", required: true, message: "Bairro é obrigatório" },
  { key: "city", required: true, message: "Cidade é obrigatória" },
  { key: "state_abbr", required: true, message: "UF é obrigatória" },
];

function collectRequiredErrors(
  form: AddressFormValues,
  prefix: string,
  errors: Record<string, string>,
): void {
  for (const rule of REQUIRED_TEXT_RULES) {
    const val = (form[rule.key] ?? "").toString().trim();
    if (!val) errors[`${prefix}_${rule.key === "state_abbr" ? "state" : rule.key}`] = rule.message;
  }
}

function collectOptionalFormatErrors(
  form: AddressFormValues,
  prefix: string,
  errors: Record<string, string>,
): void {
  if (form.email && !isValidEmail(form.email)) {
    errors[`${prefix}_email`] = "Email inválido";
  }
  if (form.phone && !isValidPhone(form.phone)) {
    errors[`${prefix}_phone`] = "Telefone inválido";
  }
}

export function validateAddressForm(
  form: AddressFormValues,
  prefix: "sender" | "to",
  opts: { requirePostalCode?: boolean } = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  collectRequiredErrors(form, prefix, errors);
  collectOptionalFormatErrors(form, prefix, errors);
  if (opts.requirePostalCode && !(form.postal_code ?? "").trim()) {
    errors[`${prefix}_postal_code`] = "CEP é obrigatório";
  }
  return errors;
}

export function validateCartForms(
  sender: AddressFormValues,
  receiver: AddressFormValues,
): Record<string, string> {
  return {
    ...validateAddressForm(sender, "sender"),
    ...validateAddressForm(receiver, "to", { requirePostalCode: true }),
  };
}

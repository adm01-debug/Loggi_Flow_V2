/* eslint-disable sonarjs/slow-regex */
import { z } from "zod";

// Validadores comuns
const cnpjRegex = /^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}$/;
const cepRegex = /^\d{5}-?\d{3}$/;

// Função para validar dígitos verificadores do CNPJ
export function validateCNPJDigits(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, "");
  
  if (numbers.length !== 14) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Calculate first check digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(numbers[12]) !== digit1) return false;
  
  // Calculate second check digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(numbers[13]) === digit2;
}

// Custom CNPJ validation with digit verification
const cnpjSchema = z.string().refine((val) => {
  if (!val || val === "") return true; // Allow empty
  const formatted = val.replace(/\D/g, "");
  if (formatted.length !== 14) return false;
  return validateCNPJDigits(formatted);
}, { message: "CNPJ inválido - dígitos verificadores incorretos" });

// Schema para Cliente
export const clienteSchema = z.object({
  razao_social: z.string().min(3, "Razão social deve ter no mínimo 3 caracteres"),
  nome_fantasia: z.string().optional(),
  cnpj: cnpjSchema.optional().or(z.literal("")),
  endereco_completo: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"),
  cidade: z.string().optional(),
  estado: z.string().length(2, "UF deve ter 2 caracteres").optional().or(z.literal("")),
  cep: z.string().regex(cepRegex, "CEP inválido").optional().or(z.literal("")),
  contato_nome: z.string().optional(),
  contato_email: z.string().email("Email inválido").optional().or(z.literal("")),
  contato_telefone: z.string().regex(phoneRegex, "Telefone inválido").optional().or(z.literal("")),
  horario_entrega: z.string().optional(),
  restricoes_entrega: z.string().optional(),
});

// Schema para Fornecedor
export const fornecedorSchema = z.object({
  razao_social: z.string().min(3, "Razão social deve ter no mínimo 3 caracteres"),
  nome_fantasia: z.string().optional(),
  cnpj: cnpjSchema.optional().or(z.literal("")),
  endereco_completo: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"),
  cidade: z.string().optional(),
  estado: z.string().length(2, "UF deve ter 2 caracteres").optional().or(z.literal("")),
  cep: z.string().regex(cepRegex, "CEP inválido").optional().or(z.literal("")),
  contato_nome: z.string().optional(),
  contato_email: z.string().email("Email inválido").optional().or(z.literal("")),
  contato_telefone: z.string().regex(phoneRegex, "Telefone inválido").optional().or(z.literal("")),
});

// Schema para Transportadora
export const transportadoraSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  cnpj: cnpjSchema.optional().or(z.literal("")),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2, "UF deve ter 2 caracteres").optional().or(z.literal("")),
  cep: z.string().regex(cepRegex, "CEP inválido").optional().or(z.literal("")),
  telefone: z.string().regex(phoneRegex, "Telefone inválido").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  prazo_medio_dias: z.number().min(0).optional(),
  avaliacao: z.number().min(0).max(5).optional(),
  ativa: z.boolean().default(true),
});

// Schema para Coleta
export const coletaSchema = z.object({
  fornecedor_id: z.string().uuid("Selecione um fornecedor"),
  endereco_coleta: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"),
  observacoes: z.string().optional(),
  tipo_coleta: z.enum(["lalamove", "transportadora"]),
  transportadora_id: z.string().uuid().optional(),
});

// Schema para Entrega
export const entregaSchema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente").optional(),
  endereco_entrega: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"),
  transportadora_id: z.string().uuid().optional(),
  tipo_frete: z.enum(["cif", "fob", "cortesia"]),
  previsao_entrega: z.string().optional(),
  observacoes: z.string().optional(),
});

// Schema para Ocorrência
export const ocorrenciaSchema = z.object({
  tipo_ocorrencia: z.string().min(1, "Selecione um tipo"),
  descricao: z.string().optional(),
  acao_tomada: z.string().optional(),
  coleta_id: z.string().uuid().optional(),
  entrega_id: z.string().uuid().optional(),
});

// Schema para Frete Interno
export const freteInternoSchema = z.object({
  origem: z.string().min(3, "Origem deve ter no mínimo 3 caracteres"),
  destino: z.string().min(3, "Destino deve ter no mínimo 3 caracteres"),
  motorista: z.string().optional(),
  quantidade_itens: z.number().min(1, "Mínimo 1 item"),
  previsao_entrega: z.string().optional(),
  xp_reward: z.number().min(0).default(50),
  observacoes: z.string().optional(),
});

// Types derivados dos schemas
export type ClienteForm = z.infer<typeof clienteSchema>;
export type FornecedorForm = z.infer<typeof fornecedorSchema>;
export type TransportadoraForm = z.infer<typeof transportadoraSchema>;
export type ColetaForm = z.infer<typeof coletaSchema>;
export type EntregaForm = z.infer<typeof entregaSchema>;
export type OcorrenciaForm = z.infer<typeof ocorrenciaSchema>;
export type FreteInternoForm = z.infer<typeof freteInternoSchema>;

// Helper para validar e retornar erros
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    if (err.path.length > 0) {
      errors[err.path[0].toString()] = err.message;
    }
  });
  
  return { success: false, errors };
}

// Helper para formatar CNPJ
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
}

// Helper para formatar CPF
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

// Helper para formatar CPF ou CNPJ baseado no tamanho
export function formatCPFCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) return formatCPF(numbers);
  return formatCNPJ(numbers);
}

// Helper para formatar telefone
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : '';
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

// Helper para formatar CEP
export function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
}

// Helper para validar email
export function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // empty is ok (optional)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Helper para validar telefone
export function isValidPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true;
  const numbers = phone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
}

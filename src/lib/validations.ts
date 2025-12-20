import { z } from "zod";

// Validadores comuns
const cnpjRegex = /^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}$/;
const cepRegex = /^\d{5}-?\d{3}$/;

// Schema para Cliente
export const clienteSchema = z.object({
  razao_social: z.string().min(3, "Razão social deve ter no mínimo 3 caracteres"),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().regex(cnpjRegex, "CNPJ inválido").optional().or(z.literal("")),
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
  cnpj: z.string().regex(cnpjRegex, "CNPJ inválido").optional().or(z.literal("")),
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
  cnpj: z.string().regex(cnpjRegex, "CNPJ inválido").optional().or(z.literal("")),
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
  result.error.errors.forEach((err) => {
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

// Helper para formatar telefone
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return `(${numbers}`;
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

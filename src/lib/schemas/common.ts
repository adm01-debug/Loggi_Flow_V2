import { z } from 'zod';

export const addressSchema = z.object({
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  logradouro: z.string().min(3),
  numero: z.string(),
  bairro: z.string(),
  cidade: z.string(),
  estado: z.string().length(2),
});

export const carrierSchema = z.object({
  id: z.string().uuid().optional(),
  nome_fantasia: z.string().min(2),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  homologada: z.boolean().default(false),
});

export const deliverySchema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(['pendente', 'coletado', 'despachado', 'em_transito', 'saiu_entrega', 'entregue', 'atrasado', 'cancelado']),
  valor_frete: z.number().nonnegative(),
  previsao_entrega: z.string().datetime().optional(),
});

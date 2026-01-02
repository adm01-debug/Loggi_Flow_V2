import { z } from 'zod';

export const entregaSchema = z.object({
  codigo: z.string().min(1),
  remetente_nome: z.string().min(1),
  remetente_endereco: z.string().optional(),
  destinatario_nome: z.string().min(1),
  destinatario_endereco: z.string().min(1),
  destinatario_telefone: z.string().optional(),
  status: z.enum(['pendente', 'coletado', 'em_transito', 'saiu_entrega', 'entregue', 'devolvido', 'cancelado']).default('pendente'),
  motorista_id: z.string().uuid().optional(),
  data_previsao: z.string().optional(),
  valor_frete: z.coerce.number().positive().optional(),
  peso: z.coerce.number().positive().optional(),
});

export const motoristaSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string(),
  telefone: z.string().optional(),
  placa_veiculo: z.string().optional(),
  tipo_veiculo: z.enum(['moto', 'carro', 'van', 'caminhao']).optional(),
  ativo: z.coerce.boolean().default(true),
});

export const loggiImportTemplates = {
  entregas: [
    { key: 'codigo', label: 'Código', example: 'ENT-001' },
    { key: 'remetente_nome', label: 'Remetente', example: 'Loja X' },
    { key: 'destinatario_nome', label: 'Destinatário', example: 'João' },
    { key: 'destinatario_endereco', label: 'Endereço', example: 'Rua X, 123' },
    { key: 'valor_frete', label: 'Frete', example: '25.00' },
  ],
};

export const loggiFilterConfigs = {
  entregas: [
    { key: 'status', label: 'Status', type: 'select' as const, options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'coletado', label: 'Coletado' },
      { value: 'em_transito', label: 'Em Trânsito' },
      { value: 'saiu_entrega', label: 'Saiu Entrega' },
      { value: 'entregue', label: 'Entregue' },
      { value: 'devolvido', label: 'Devolvido' },
    ]},
  ],
};

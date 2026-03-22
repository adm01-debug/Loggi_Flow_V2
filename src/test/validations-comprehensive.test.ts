import { describe, it, expect } from 'vitest';
import { validateForm, validateCNPJDigits, clienteSchema, fornecedorSchema, entregaSchema, coletaSchema, freteInternoSchema, ocorrenciaSchema, formatCNPJ, formatCPF, formatCPFCNPJ, formatPhone, formatCEP, isValidEmail, isValidPhone } from '@/lib/validations';

describe('Zod Schema Validation - clienteSchema', () => {
  it('accepts valid cliente data', () => {
    const result = validateForm(clienteSchema, {
      razao_social: 'Empresa Teste LTDA',
      endereco_completo: 'Rua Teste, 123, São Paulo - SP',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short razao_social', () => {
    const result = validateForm(clienteSchema, {
      razao_social: 'AB',
      endereco_completo: 'Rua Teste, 123, São Paulo - SP',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors).toBeDefined();
  });

  it('rejects short endereco', () => {
    const result = validateForm(clienteSchema, {
      razao_social: 'Empresa Teste',
      endereco_completo: 'Rua',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors).toBeDefined();
  });

  it('accepts empty optional fields', () => {
    const result = validateForm(clienteSchema, {
      razao_social: 'Empresa Teste LTDA',
      endereco_completo: 'Rua Teste, 123, São Paulo - SP',
      cnpj: '',
      contato_email: '',
      contato_telefone: '',
      cep: '',
      estado: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = validateForm(clienteSchema, {
      razao_social: 'Empresa Teste LTDA',
      endereco_completo: 'Rua Teste, 123, São Paulo - SP',
      contato_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid CNPJ', () => {
    const result = validateForm(clienteSchema, {
      razao_social: 'Empresa Teste LTDA',
      endereco_completo: 'Rua Teste, 123, São Paulo - SP',
      cnpj: '11222333000181',
    });
    expect(result.success).toBe(true);
  });
});

describe('Zod Schema Validation - entregaSchema', () => {
  it('accepts valid entrega', () => {
    const result = validateForm(entregaSchema, {
      endereco_entrega: 'Rua da Entrega, 456, Bairro - SP',
      tipo_frete: 'cif',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid tipo_frete', () => {
    const result = validateForm(entregaSchema, {
      endereco_entrega: 'Rua da Entrega, 456, Bairro - SP',
      tipo_frete: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all frete types', () => {
    for (const tipo of ['cif', 'fob', 'cortesia']) {
      const result = validateForm(entregaSchema, {
        endereco_entrega: 'Rua da Entrega, 456, Bairro - SP',
        tipo_frete: tipo,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('Zod Schema Validation - coletaSchema', () => {
  it('accepts valid coleta', () => {
    const result = validateForm(coletaSchema, {
      fornecedor_id: '550e8400-e29b-41d4-a716-446655440000',
      endereco_coleta: 'Rua da Coleta, 789, Centro - RJ',
      tipo_coleta: 'lalamove',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid fornecedor_id', () => {
    const result = validateForm(coletaSchema, {
      fornecedor_id: 'not-a-uuid',
      endereco_coleta: 'Rua da Coleta, 789, Centro - RJ',
      tipo_coleta: 'lalamove',
    });
    expect(result.success).toBe(false);
  });
});

describe('Zod Schema Validation - freteInternoSchema', () => {
  it('accepts valid frete interno', () => {
    const result = validateForm(freteInternoSchema, {
      origem: 'Armazém Central',
      destino: 'Filial Norte',
      quantidade_itens: 5,
      xp_reward: 50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero quantity', () => {
    const result = validateForm(freteInternoSchema, {
      origem: 'Armazém Central',
      destino: 'Filial Norte',
      quantidade_itens: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('CNPJ Digit Validation', () => {
  it('validates correct CNPJ 11.222.333/0001-81', () => {
    expect(validateCNPJDigits('11222333000181')).toBe(true);
  });

  it('rejects all-same digits', () => {
    expect(validateCNPJDigits('11111111111111')).toBe(false);
  });

  it('rejects wrong check digits', () => {
    expect(validateCNPJDigits('11222333000199')).toBe(false);
  });

  it('rejects short input', () => {
    expect(validateCNPJDigits('123')).toBe(false);
  });
});

describe('Validation Formatters', () => {
  it('formatCNPJ progressive formatting', () => {
    expect(formatCNPJ('11')).toBe('11');
    expect(formatCNPJ('11222')).toBe('11.222');
    expect(formatCNPJ('11222333')).toBe('11.222.333');
    expect(formatCNPJ('112223330001')).toBe('11.222.333/0001');
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formatCPF progressive formatting', () => {
    expect(formatCPF('123')).toBe('123');
    expect(formatCPF('123456')).toBe('123.456');
    expect(formatCPF('123456789')).toBe('123.456.789');
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });

  it('formatCPFCNPJ auto-detects', () => {
    expect(formatCPFCNPJ('12345678901')).toBe('123.456.789-01');
    expect(formatCPFCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formatPhone formats progressively', () => {
    expect(formatPhone('11')).toBe('(11');
    expect(formatPhone('119876')).toBe('(11) 9876');
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formatCEP formats progressively', () => {
    expect(formatCEP('01310')).toBe('01310');
    expect(formatCEP('01310100')).toBe('01310-100');
  });
});

describe('Email/Phone Validators', () => {
  it('isValidEmail accepts empty (optional)', () => {
    expect(isValidEmail('')).toBe(true);
  });

  it('isValidEmail accepts valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('isValidEmail rejects invalid', () => {
    expect(isValidEmail('not-email')).toBe(false);
    expect(isValidEmail('@test')).toBe(false);
  });

  it('isValidPhone accepts empty (optional)', () => {
    expect(isValidPhone('')).toBe(true);
  });

  it('isValidPhone accepts 10 digits', () => {
    expect(isValidPhone('1134567890')).toBe(true);
  });

  it('isValidPhone accepts 11 digits', () => {
    expect(isValidPhone('11987654321')).toBe(true);
  });

  it('isValidPhone rejects 9 digits', () => {
    expect(isValidPhone('123456789')).toBe(false);
  });

  it('isValidPhone rejects 12 digits', () => {
    expect(isValidPhone('123456789012')).toBe(false);
  });
});

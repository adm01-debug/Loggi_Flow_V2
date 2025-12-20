import { describe, it, expect } from 'vitest';

// Formatters (inline for testing)
const formatCNPJ = (value: string | null): string => {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length !== 14) return value;
  return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

const formatCPF = (value: string | null): string => {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length !== 11) return value;
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (value: string | null): string => {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
};

const formatCEP = (value: string | null): string => {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length !== 8) return value;
  return n.replace(/(\d{5})(\d{3})/, "$1-$2");
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatPercent = (value: number | null): string => {
  if (value === null) return "-";
  return `${value.toFixed(1)}%`;
};

const truncate = (text: string | null, max: number = 50): string => {
  if (!text) return "-";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

const slugify = (text: string): string => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
};

describe('Document Formatters', () => {
  describe('formatCNPJ', () => {
    it('formats valid CNPJ', () => {
      expect(formatCNPJ('12345678000195')).toBe('12.345.678/0001-95');
    });
    it('returns original for invalid CNPJ', () => {
      expect(formatCNPJ('123')).toBe('123');
    });
    it('handles null', () => {
      expect(formatCNPJ(null)).toBe('-');
    });
  });

  describe('formatCPF', () => {
    it('formats valid CPF', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
    });
    it('returns original for invalid CPF', () => {
      expect(formatCPF('123')).toBe('123');
    });
  });

  describe('formatPhone', () => {
    it('formats mobile phone (11 digits)', () => {
      expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
    });
    it('formats landline (10 digits)', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });
    it('handles null', () => {
      expect(formatPhone(null)).toBe('-');
    });
  });

  describe('formatCEP', () => {
    it('formats valid CEP', () => {
      expect(formatCEP('01310100')).toBe('01310-100');
    });
    it('returns original for invalid CEP', () => {
      expect(formatCEP('123')).toBe('123');
    });
  });
});

describe('Number Formatters', () => {
  describe('formatCurrency', () => {
    it('formats positive values', () => {
      expect(formatCurrency(1234.56)).toContain('1.234,56');
    });
    it('handles null', () => {
      expect(formatCurrency(null)).toBe('-');
    });
    it('formats zero', () => {
      expect(formatCurrency(0)).toContain('0,00');
    });
  });

  describe('formatPercent', () => {
    it('formats percentage', () => {
      expect(formatPercent(95.5)).toBe('95.5%');
    });
    it('handles null', () => {
      expect(formatPercent(null)).toBe('-');
    });
  });
});

describe('Text Formatters', () => {
  describe('truncate', () => {
    it('truncates long text', () => {
      const long = 'a'.repeat(100);
      expect(truncate(long, 50)).toBe('a'.repeat(50) + '...');
    });
    it('keeps short text', () => {
      expect(truncate('short', 50)).toBe('short');
    });
    it('handles null', () => {
      expect(truncate(null)).toBe('-');
    });
  });

  describe('slugify', () => {
    it('creates slug from text', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });
    it('removes accents', () => {
      expect(slugify('Ação Coração')).toBe('acao-coracao');
    });
    it('removes special chars', () => {
      expect(slugify('Test! @#$ Value')).toBe('test-value');
    });
  });
});

describe('Gamification Calculations', () => {
  const calculateLevel = (xp: number): number => Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const xpForLevel = (level: number): number => (level - 1) * (level - 1) * 100;

  it('calculates level from XP', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(400)).toBe(3);
    expect(calculateLevel(900)).toBe(4);
  });

  it('calculates XP for level', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(400);
    expect(xpForLevel(5)).toBe(1600);
  });
});

describe('Status Helpers', () => {
  const statusLabels: Record<string, string> = {
    aguardando_producao: 'Aguardando Produção',
    em_transito: 'Em Trânsito',
    entregue: 'Entregue',
    finalizada: 'Finalizada',
  };

  it('returns correct labels', () => {
    expect(statusLabels.aguardando_producao).toBe('Aguardando Produção');
    expect(statusLabels.em_transito).toBe('Em Trânsito');
  });
});

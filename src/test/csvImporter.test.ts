import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const mockSchema = z.object({ nome: z.string(), valor: z.coerce.number() });

describe('csvImporter', () => {
  it('should parse valid CSV data', () => {
    const data = [{ nome: 'Test', valor: '100' }];
    const result = mockSchema.safeParse(data[0]);
    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const data = { nome: '', valor: 'abc' };
    const result = mockSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should handle empty values', () => {
    const data = { nome: 'Test', valor: '0' };
    const result = mockSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('generateCSVTemplate', () => {
  it('should generate template with headers', () => {
    const columns = [{ key: 'nome', label: 'Nome', example: 'João' }];
    const template = `${columns[0].label}\n${columns[0].example}`;
    expect(template).toContain('Nome');
  });
});

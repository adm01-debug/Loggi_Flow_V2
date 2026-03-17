import { describe, it, expect } from 'vitest';
import { formatPhone, formatCPF, formatCPFCNPJ, formatCNPJ, formatCEP, isValidEmail, isValidPhone } from '@/lib/validations';

describe('formatPhone', () => {
  it('formats empty string', () => {
    expect(formatPhone('')).toBe('');
  });
  it('formats 2 digits with parentheses', () => {
    expect(formatPhone('11')).toBe('(11');
  });
  it('formats 6 digits', () => {
    expect(formatPhone('119999')).toBe('(11) 9999');
  });
  it('formats 10 digits (landline)', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
  });
  it('formats 11 digits (mobile)', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
  });
  it('strips non-numeric chars before formatting', () => {
    expect(formatPhone('(11) 99999-8888')).toBe('(11) 99999-8888');
  });
});

describe('formatCPF', () => {
  it('formats 11-digit CPF', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });
  it('formats partial CPF', () => {
    expect(formatCPF('123')).toBe('123');
    expect(formatCPF('1234')).toBe('123.4');
  });
});

describe('formatCPFCNPJ', () => {
  it('formats as CPF when <= 11 digits', () => {
    expect(formatCPFCNPJ('12345678901')).toBe('123.456.789-01');
  });
  it('formats as CNPJ when > 11 digits', () => {
    expect(formatCPFCNPJ('12345678000195')).toBe('12.345.678/0001-95');
  });
  it('handles masked input (strips and re-formats)', () => {
    expect(formatCPFCNPJ('123.456.789-01')).toBe('123.456.789-01');
  });
});

describe('formatCEP', () => {
  it('formats 8-digit CEP', () => {
    expect(formatCEP('01310100')).toBe('01310-100');
  });
  it('handles partial', () => {
    expect(formatCEP('013')).toBe('013');
  });
});

describe('isValidEmail', () => {
  it('returns true for empty (optional)', () => {
    expect(isValidEmail('')).toBe(true);
    expect(isValidEmail('  ')).toBe(true);
  });
  it('returns true for valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });
  it('returns false for invalid email', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('returns true for empty (optional)', () => {
    expect(isValidPhone('')).toBe(true);
  });
  it('returns true for 10-digit phone', () => {
    expect(isValidPhone('(11) 3333-4444')).toBe(true);
  });
  it('returns true for 11-digit phone', () => {
    expect(isValidPhone('(11) 99999-8888')).toBe(true);
  });
  it('returns false for too short', () => {
    expect(isValidPhone('123')).toBe(false);
  });
  it('returns false for too long', () => {
    expect(isValidPhone('123456789012')).toBe(false);
  });
});

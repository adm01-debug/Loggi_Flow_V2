import { describe, it, expect } from 'vitest';
import {
  formatDate, formatDateTime, formatRelativeTime,
  formatCurrency, formatNumber, formatPercent,
  formatCNPJ, formatCPF, formatPhone, formatCEP,
  truncate, capitalize, slugify,
  formatFileSize, formatDuration, formatHours,
} from '@/lib/formatters';

describe('Date Formatters', () => {
  it('formatDate returns "-" for null/undefined', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
  });

  it('formatDate formats ISO string', () => {
    expect(formatDate('2026-03-22T10:00:00Z')).toMatch(/22\/03\/2026/);
  });

  it('formatDate handles Date object', () => {
    expect(formatDate(new Date(2026, 2, 22))).toBe('22/03/2026');
  });

  it('formatDate returns "-" for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-');
  });

  it('formatDate supports custom pattern', () => {
    expect(formatDate('2026-01-15', 'yyyy')).toBe('2026');
  });

  it('formatDateTime includes time', () => {
    const result = formatDateTime('2026-03-22T14:30:00Z');
    expect(result).toMatch(/22\/03\/2026/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('formatRelativeTime returns "-" for null', () => {
    expect(formatRelativeTime(null)).toBe('-');
  });

  it('formatRelativeTime returns relative string for valid date', () => {
    const recent = new Date(Date.now() - 60000).toISOString();
    expect(formatRelativeTime(recent)).toContain('há');
  });
});

describe('Number Formatters', () => {
  it('formatCurrency formats BRL', () => {
    expect(formatCurrency(1234.56)).toMatch(/1\.234,56/);
  });

  it('formatCurrency returns "-" for null', () => {
    expect(formatCurrency(null)).toBe('-');
    expect(formatCurrency(undefined)).toBe('-');
  });

  it('formatCurrency handles zero', () => {
    expect(formatCurrency(0)).toMatch(/0,00/);
  });

  it('formatNumber with decimals', () => {
    expect(formatNumber(1234.567, 2)).toMatch(/1\.234,57/);
  });

  it('formatNumber returns "-" for null', () => {
    expect(formatNumber(null)).toBe('-');
  });

  it('formatPercent formats with 1 decimal', () => {
    expect(formatPercent(95.5)).toMatch(/95,5%/);
  });

  it('formatPercent returns "-" for null', () => {
    expect(formatPercent(null)).toBe('-');
  });
});

describe('Document Formatters', () => {
  it('formatCNPJ formats 14 digits', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formatCNPJ returns original for wrong length', () => {
    expect(formatCNPJ('123')).toBe('123');
  });

  it('formatCNPJ returns "-" for null/undefined', () => {
    expect(formatCNPJ(null)).toBe('-');
    expect(formatCNPJ(undefined)).toBe('-');
  });

  it('formatCPF formats 11 digits', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });

  it('formatCPF returns "-" for null', () => {
    expect(formatCPF(null)).toBe('-');
  });

  it('formatPhone formats 11 digit mobile', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formatPhone formats 10 digit landline', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
  });

  it('formatPhone returns "-" for null', () => {
    expect(formatPhone(null)).toBe('-');
  });

  it('formatCEP formats 8 digits', () => {
    expect(formatCEP('01310100')).toBe('01310-100');
  });

  it('formatCEP returns "-" for null', () => {
    expect(formatCEP(null)).toBe('-');
  });

  it('formatCEP returns original for wrong length', () => {
    expect(formatCEP('123')).toBe('123');
  });
});

describe('Text Formatters', () => {
  it('truncate shortens long text', () => {
    expect(truncate('a'.repeat(60), 50)).toBe('a'.repeat(50) + '...');
  });

  it('truncate keeps short text as-is', () => {
    expect(truncate('hello', 50)).toBe('hello');
  });

  it('truncate returns "-" for null', () => {
    expect(truncate(null)).toBe('-');
  });

  it('capitalize capitalizes first letter', () => {
    expect(capitalize('hello world')).toBe('Hello world');
  });

  it('capitalize returns "-" for null', () => {
    expect(capitalize(null)).toBe('-');
  });

  it('slugify creates URL-safe string', () => {
    expect(slugify('São Paulo - Brasil')).toBe('sao-paulo-brasil');
  });

  it('slugify handles accented chars', () => {
    expect(slugify('café à três')).toBe('cafe-a-tres');
  });
});

describe('File Size Formatter', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats with decimals', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('Duration Formatter', () => {
  it('formatDuration short minutes', () => {
    expect(formatDuration(45)).toBe('45min');
  });

  it('formatDuration hours and minutes', () => {
    expect(formatDuration(125)).toBe('2h 5min');
  });

  it('formatDuration exact hours', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formatHours sub-24', () => {
    expect(formatHours(5)).toMatch(/5/);
  });

  it('formatHours converts to days', () => {
    expect(formatHours(48)).toBe('2d');
  });

  it('formatHours days and hours', () => {
    expect(formatHours(50)).toMatch(/2d/);
  });
});

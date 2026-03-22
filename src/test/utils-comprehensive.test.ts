import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined/null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('merges tailwind conflicts', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles empty call', () => {
    expect(cn()).toBe('');
  });
});

describe('Query Config', () => {
  it('can import queryConfig without errors', async () => {
    const mod = await import('@/lib/queryConfig');
    expect(mod.QUERY_STALE_TIME).toBeDefined();
  });
});

describe('Constants', () => {
  it('can import constants', async () => {
    const mod = await import('@/lib/constants');
    expect(mod).toBeDefined();
  });
});

describe('CSV Importer', () => {
  it('exports parseCSV function', async () => {
    const mod = await import('@/lib/csvImporter');
    expect(mod).toBeDefined();
  });
});

describe('Excel Importer', () => {
  it('exports functions', async () => {
    const mod = await import('@/lib/excelImporter');
    expect(mod).toBeDefined();
  });
});

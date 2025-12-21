import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '@/hooks/useExport';

describe('useExport', () => {
  it('should have exportToCSV function', () => {
    const { result } = renderHook(() => useExport());
    expect(typeof result.current.exportToCSV).toBe('function');
  });

  it('should have exportToJSON function', () => {
    const { result } = renderHook(() => useExport());
    expect(typeof result.current.exportToJSON).toBe('function');
  });

  it('should generate CSV from data', () => {
    const { result } = renderHook(() => useExport());
    const data = [{ name: 'Test', value: 123 }];
    expect(() => result.current.exportToCSV(data, 'test')).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSorting } from '@/hooks/useSorting';

interface TestItem { id: number; name: string; price: number; }

describe('useSorting', () => {
  const mockData: TestItem[] = [
    { id: 3, name: 'Cherry', price: 2.5 },
    { id: 1, name: 'Apple', price: 1.5 },
    { id: 4, name: 'Date', price: 3.0 },
    { id: 2, name: 'Banana', price: 0.5 },
  ];

  it('should sort ascending', () => {
    const { result } = renderHook(() => useSorting(mockData, { defaultKey: 'name', defaultDirection: 'asc' }));
    expect(result.current.sortedData[0].name).toBe('Apple');
    expect(result.current.sortedData[3].name).toBe('Date');
  });

  it('should sort descending', () => {
    const { result } = renderHook(() => useSorting(mockData, { defaultKey: 'price', defaultDirection: 'desc' }));
    expect(result.current.sortedData[0].price).toBe(3.0);
    expect(result.current.sortedData[3].price).toBe(0.5);
  });

  it('should toggle sort direction', () => {
    const { result } = renderHook(() => useSorting(mockData, { defaultKey: 'name', defaultDirection: 'asc' }));
    expect(result.current.sortedData[0].name).toBe('Apple');
    act(() => { result.current.toggleSort('name'); });
    expect(result.current.sortedData[0].name).toBe('Date');
  });

  it('should change sort key', () => {
    const { result } = renderHook(() => useSorting(mockData, { defaultKey: 'name', defaultDirection: 'asc' }));
    act(() => { result.current.toggleSort('price'); });
    expect(result.current.sortedData[0].price).toBe(0.5);
  });

  it('should return correct sort direction', () => {
    const { result } = renderHook(() => useSorting(mockData, { defaultKey: 'name', defaultDirection: 'asc' }));
    expect(result.current.getSortDirection('name')).toBe('asc');
    expect(result.current.getSortDirection('price')).toBeNull();
  });
});

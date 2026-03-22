import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { useFilters, FilterConfig } from '@/hooks/useFilters';

// ===== usePagination =====
describe('usePagination', () => {
  const data = Array.from({ length: 25 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it('initializes with page 1', () => {
    const { result } = renderHook(() => usePagination(data, { initialPageSize: 10 }));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.totalItems).toBe(25);
  });

  it('paginates data correctly', () => {
    const { result } = renderHook(() => usePagination(data, { initialPageSize: 10 }));
    expect(result.current.paginatedData).toHaveLength(10);
    expect(result.current.paginatedData[0].id).toBe(0);
  });

  it('navigates to next page', () => {
    const { result } = renderHook(() => usePagination(data, { initialPageSize: 10 }));
    act(() => result.current.nextPage());
    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedData[0].id).toBe(10);
  });

  it('navigates to last page', () => {
    const { result } = renderHook(() => usePagination(data, { initialPageSize: 10 }));
    act(() => result.current.lastPage());
    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedData).toHaveLength(5);
  });

  it('changes page size', () => {
    const { result } = renderHook(() => usePagination(data, { initialPageSize: 10 }));
    act(() => result.current.setPageSize(5));
    expect(result.current.totalPages).toBe(5);
    expect(result.current.paginatedData).toHaveLength(5);
  });

  it('hasNextPage and hasPrevPage', () => {
    const { result } = renderHook(() => usePagination(data, { initialPageSize: 10 }));
    expect(result.current.hasPrevPage).toBe(false);
    expect(result.current.hasNextPage).toBe(true);
    act(() => result.current.lastPage());
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPrevPage).toBe(true);
  });

  it('handles empty data', () => {
    const { result } = renderHook(() => usePagination([], { initialPageSize: 10 }));
    expect(result.current.totalPages).toBeLessThanOrEqual(1);
    expect(result.current.paginatedData).toHaveLength(0);
  });
});

// ===== useSorting (extended) =====
describe('useSorting (extended)', () => {
  const data = [
    { id: 1, name: 'Charlie', value: 30 },
    { id: 2, name: 'Alice', value: 10 },
    { id: 3, name: 'Bob', value: 20 },
  ];

  it('sorts strings ascending', () => {
    const { result } = renderHook(() => useSorting(data, { defaultKey: 'name', defaultDirection: 'asc' }));
    expect(result.current.sortedData[0].name).toBe('Alice');
    expect(result.current.sortedData[2].name).toBe('Charlie');
  });

  it('sorts numbers descending', () => {
    const { result } = renderHook(() => useSorting(data, { defaultKey: 'value', defaultDirection: 'desc' }));
    expect(result.current.sortedData[0].value).toBe(30);
  });

  it('getSortDirection returns correct direction', () => {
    const { result } = renderHook(() => useSorting(data, { defaultKey: 'name', defaultDirection: 'asc' }));
    expect(result.current.getSortDirection('name')).toBe('asc');
    expect(result.current.getSortDirection('value')).toBe(null);
  });

  it('toggleSort changes key', () => {
    const { result } = renderHook(() => useSorting(data, { defaultKey: 'name', defaultDirection: 'asc' }));
    act(() => result.current.toggleSort('value'));
    expect(result.current.getSortDirection('value')).toBe('asc');
    expect(result.current.sortedData[0].value).toBe(10);
  });
});

// ===== useFilters =====
describe('useFilters', () => {
  interface TestItem {
    id: number;
    nome: string;
    status: string;
  }

  const items: TestItem[] = [
    { id: 1, nome: 'Entrega SP', status: 'ativa' },
    { id: 2, nome: 'Entrega RJ', status: 'inativa' },
    { id: 3, nome: 'Coleta SP', status: 'ativa' },
  ];

  const config: FilterConfig<TestItem> = {
    search: { fields: ['nome'], placeholder: 'Buscar...' },
    status: { field: 'status', options: [{ value: 'ativa', label: 'Ativa' }, { value: 'inativa', label: 'Inativa' }] },
  };

  it('returns all items initially', () => {
    const { result } = renderHook(() => useFilters(items, config));
    expect(result.current.filteredData).toHaveLength(3);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('filters by search text', () => {
    const { result } = renderHook(() => useFilters(items, config));
    act(() => result.current.setSearch('SP'));
    expect(result.current.filteredData).toHaveLength(2);
  });

  it('filters by status', () => {
    const { result } = renderHook(() => useFilters(items, config));
    act(() => result.current.setStatus('inativa'));
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].id).toBe(2);
  });

  it('combines search and status filter', () => {
    const { result } = renderHook(() => useFilters(items, config));
    act(() => { result.current.setSearch('Entrega'); result.current.setStatus('ativa'); });
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].id).toBe(1);
  });

  it('clearFilters resets all', () => {
    const { result } = renderHook(() => useFilters(items, config));
    act(() => { result.current.setSearch('SP'); result.current.setStatus('ativa'); });
    expect(result.current.hasActiveFilters).toBe(true);
    act(() => result.current.clearFilters());
    expect(result.current.filteredData).toHaveLength(3);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

// ===== useLocalStorage (extended) =====
describe('useLocalStorage (extended)', () => {
  it('persists arrays', () => {
    const { result } = renderHook(() => useLocalStorage('test-arr', [1, 2, 3]));
    expect(result.current[0]).toEqual([1, 2, 3]);
    act(() => result.current[1]([4, 5]));
    expect(result.current[0]).toEqual([4, 5]);
  });

  it('persists booleans', () => {
    const { result } = renderHook(() => useLocalStorage('test-bool', false));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  it('handles complex nested objects', () => {
    const obj = { a: { b: { c: 'deep' } }, arr: [1, 2] };
    const { result } = renderHook(() => useLocalStorage('test-complex', obj));
    expect(result.current[0]).toEqual(obj);
  });
});

// ===== useDebounce =====
describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });
});

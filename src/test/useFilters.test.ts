import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters, FilterConfig } from '@/hooks/useFilters';

interface TestItem {
  id: number;
  name: string;
  status: string;
  category: string;
  price: number;
}

describe('useFilters', () => {
  const mockData: TestItem[] = [
    { id: 1, name: 'Apple', status: 'active', category: 'fruit', price: 1.5 },
    { id: 2, name: 'Banana', status: 'active', category: 'fruit', price: 0.5 },
    { id: 3, name: 'Carrot', status: 'inactive', category: 'vegetable', price: 0.8 },
    { id: 4, name: 'Date', status: 'active', category: 'fruit', price: 2.0 },
    { id: 5, name: 'Eggplant', status: 'inactive', category: 'vegetable', price: 1.2 },
  ];

  const filterConfig: FilterConfig<TestItem>[] = [
    { key: 'search', type: 'search', fields: ['name'] },
    { key: 'status', type: 'select', field: 'status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
    { key: 'category', type: 'select', field: 'category', options: [{ value: 'fruit', label: 'Fruit' }, { value: 'vegetable', label: 'Vegetable' }] },
  ];

  it('should return all data when no filters applied', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    expect(result.current.filteredData).toHaveLength(5);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should filter by search text', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    
    act(() => {
      result.current.setFilter('search', 'app');
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('Apple');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should filter by select value', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    
    act(() => {
      result.current.setFilter('status', 'active');
    });
    
    expect(result.current.filteredData).toHaveLength(3);
    expect(result.current.filteredData.every(item => item.status === 'active')).toBe(true);
  });

  it('should combine multiple filters', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    
    act(() => {
      result.current.setFilter('status', 'active');
      result.current.setFilter('category', 'fruit');
    });
    
    expect(result.current.filteredData).toHaveLength(3);
    expect(result.current.filteredData.every(item => item.status === 'active' && item.category === 'fruit')).toBe(true);
  });

  it('should clear single filter', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    
    act(() => {
      result.current.setFilter('status', 'active');
      result.current.setFilter('category', 'fruit');
    });
    
    expect(result.current.filteredData).toHaveLength(3);
    
    act(() => {
      result.current.setFilter('status', undefined);
    });
    
    expect(result.current.filteredData).toHaveLength(3); // All fruits
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    
    act(() => {
      result.current.setFilter('search', 'apple');
      result.current.setFilter('status', 'active');
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    
    act(() => {
      result.current.clearFilters();
    });
    
    expect(result.current.filteredData).toHaveLength(5);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should be case insensitive for search', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    
    act(() => {
      result.current.setFilter('search', 'APPLE');
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('Apple');
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() => useFilters([], filterConfig));
    
    expect(result.current.filteredData).toHaveLength(0);
    
    act(() => {
      result.current.setFilter('search', 'test');
    });
    
    expect(result.current.filteredData).toHaveLength(0);
  });

  it('should handle custom filter function', () => {
    const customConfig: FilterConfig<TestItem>[] = [
      ...filterConfig,
      { 
        key: 'expensive', 
        type: 'custom', 
        filterFn: (item, value) => value === 'yes' ? item.price > 1 : true 
      }
    ];
    
    const { result } = renderHook(() => useFilters(mockData, customConfig));
    
    act(() => {
      result.current.setFilter('expensive', 'yes');
    });
    
    expect(result.current.filteredData).toHaveLength(3);
    expect(result.current.filteredData.every(item => item.price > 1)).toBe(true);
  });

  it('should update filters object correctly', () => {
    const { result } = renderHook(() => useFilters(mockData, filterConfig));
    
    act(() => {
      result.current.setFilter('search', 'banana');
      result.current.setFilter('status', 'active');
    });
    
    expect(result.current.filters).toEqual({
      search: 'banana',
      status: 'active'
    });
  });
});

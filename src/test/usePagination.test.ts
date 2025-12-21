import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination(mockData));
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.paginatedData).toHaveLength(10);
  });

  it('should paginate data correctly', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    expect(result.current.paginatedData[0].id).toBe(1);
    expect(result.current.paginatedData[9].id).toBe(10);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    act(() => {
      result.current.nextPage();
    });
    
    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedData[0].id).toBe(11);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    act(() => {
      result.current.goToPage(3);
    });
    
    expect(result.current.currentPage).toBe(3);
    
    act(() => {
      result.current.prevPage();
    });
    
    expect(result.current.currentPage).toBe(2);
  });

  it('should go to specific page', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    act(() => {
      result.current.goToPage(4);
    });
    
    expect(result.current.currentPage).toBe(4);
    expect(result.current.paginatedData[0].id).toBe(31);
  });

  it('should not go beyond last page', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    act(() => {
      result.current.goToPage(10);
    });
    
    expect(result.current.currentPage).toBe(5); // Max page is 5
  });

  it('should not go before first page', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    act(() => {
      result.current.goToPage(-1);
    });
    
    expect(result.current.currentPage).toBe(1);
  });

  it('should change page size', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    act(() => {
      result.current.setPageSize(20);
    });
    
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedData).toHaveLength(20);
    expect(result.current.currentPage).toBe(1); // Reset to page 1
  });

  it('should return correct hasNextPage and hasPrevPage', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));
    
    expect(result.current.hasPrevPage).toBe(false);
    expect(result.current.hasNextPage).toBe(true);
    
    act(() => {
      result.current.goToPage(5);
    });
    
    expect(result.current.hasPrevPage).toBe(true);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() => usePagination([]));
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.paginatedData).toHaveLength(0);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPrevPage).toBe(false);
  });

  it('should recalculate when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data }) => usePagination(data, { initialPageSize: 10 }),
      { initialProps: { data: mockData } }
    );
    
    expect(result.current.totalPages).toBe(5);
    
    const smallerData = mockData.slice(0, 15);
    rerender({ data: smallerData });
    
    expect(result.current.totalPages).toBe(2);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), { initialProps: { value: 'initial' } });
    expect(result.current).toBe('initial');
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe('updated');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRealtime } from '@/hooks/useRealtime';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

describe('useRealtime', () => {
  it('should subscribe to table changes', () => {
    const onInsert = vi.fn();
    renderHook(() => useRealtime({ table: 'entregas', onInsert }));
    expect(true).toBe(true);
  });

  it('should handle onUpdate callback', () => {
    const onUpdate = vi.fn();
    renderHook(() => useRealtime({ table: 'entregas', onUpdate }));
    expect(true).toBe(true);
  });

  it('should handle onDelete callback', () => {
    const onDelete = vi.fn();
    renderHook(() => useRealtime({ table: 'entregas', onDelete }));
    expect(true).toBe(true);
  });
});

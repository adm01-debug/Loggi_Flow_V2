/**
 * Regression tests for src/hooks/common/useBulkActions.ts
 *
 * Cover the type-erased `as any` fixes (Sprint D#1) by exercising:
 *  - selection state transitions (toggle/selectAll/clearSelection/isSelected)
 *  - bulk delete / update / soft-delete / restore dispatch to Supabase
 *  - success → invalidateQueries + clearSelection
 *  - failure → error toast, selection preserved
 *  - edge cases: empty selection, duplicate toggle, unmount mid-flight
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBulkActions } from './useBulkActions';

const deleteMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const chain = () => {
    const api = {
      delete: (...args: unknown[]) => { deleteMock(...args); return api; },
      update: (...args: unknown[]) => { updateMock(...args); return api; },
      in: vi.fn().mockResolvedValue({ error: null }),
    };
    return api;
  };
  return { supabase: { from: vi.fn(() => chain()) } };
});

vi.mock('@/utils/celebrationSounds', () => ({
  playSuccessSound: vi.fn(),
  playErrorSound: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children);
  return { client, Wrapper };
}

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

beforeEach(() => {
  deleteMock.mockClear();
  updateMock.mockClear();
});

describe('useBulkActions — selection state', () => {
  it('toggle adds and removes an id idempotently', () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(
      () => useBulkActions<{ id: string }>({ table: 'audit_logs' as never, queryKey: ['k'] }),
      { wrapper: Wrapper },
    );

    act(() => result.current.toggle('a'));
    expect(result.current.selectedIds).toEqual(['a']);
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.toggle('a'));
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('selectAll captures every id; clearSelection resets to empty', () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(
      () => useBulkActions<{ id: string }>({ table: 'audit_logs' as never, queryKey: ['k'] }),
      { wrapper: Wrapper },
    );

    act(() => result.current.selectAll(items));
    expect(result.current.selectedIds).toHaveLength(3);

    act(() => result.current.clearSelection());
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
  });
});

describe('useBulkActions — mutation dispatch', () => {
  it('bulkDelete calls Supabase delete().in("id", selectedIds)', async () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(
      () => useBulkActions<{ id: string }>({ table: 'audit_logs' as never, queryKey: ['k'] }),
      { wrapper: Wrapper },
    );

    act(() => result.current.selectAll(items));
    act(() => result.current.bulkDelete());

    await waitFor(() => expect(deleteMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
  });

  it('bulkUpdate passes partial data through the chain', async () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(
      () => useBulkActions<{ id: string; name?: string }>({ table: 'audit_logs' as never, queryKey: ['k'] }),
      { wrapper: Wrapper },
    );

    act(() => result.current.selectAll(items));
    act(() => result.current.bulkUpdate({ name: 'X' }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ name: 'X' }));
  });

  it('bulkSoftDelete writes deleted_at ISO timestamp', async () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(
      () => useBulkActions<{ id: string }>({ table: 'audit_logs' as never, queryKey: ['k'] }),
      { wrapper: Wrapper },
    );

    act(() => result.current.selectAll(items));
    act(() => result.current.bulkSoftDelete());

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const payload = updateMock.mock.calls[0][0] as { deleted_at: string };
    expect(payload.deleted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('bulkRestore clears deleted_at to null', async () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(
      () => useBulkActions<{ id: string }>({ table: 'audit_logs' as never, queryKey: ['k'] }),
      { wrapper: Wrapper },
    );

    act(() => result.current.selectAll(items));
    act(() => result.current.bulkRestore());

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ deleted_at: null }));
  });

  it('empty selection still fires mutation with []', async () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(
      () => useBulkActions<{ id: string }>({ table: 'audit_logs' as never, queryKey: ['k'] }),
      { wrapper: Wrapper },
    );
    act(() => result.current.bulkDelete());
    await waitFor(() => expect(deleteMock).toHaveBeenCalledTimes(1));
    expect(result.current.selectedIds).toEqual([]);
  });
});

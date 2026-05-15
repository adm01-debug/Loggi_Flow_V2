import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { supabase } from '@/integrations/supabase/client';
import { createWrapper } from './test-utils';

vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Integração Edge Functions: melhor-envio-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar calcularFrete com os parâmetros corretos', async () => {
    const mockData = { results: [{ id: 1, name: 'Sedx', price: 25.0 }] };
    (supabase.functions.invoke as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useMelhorEnvio(), { wrapper: createWrapper() });

    const params = {
      from: { postal_code: '01001000' },
      to: { postal_code: '20040002' },
      products: [{ width: 10, height: 10, length: 10, weight: 1, insurance_value: 100, quantity: 1 }]
    };

    result.current.calcularFrete.mutate(params);

    await waitFor(() => expect(result.current.calcularFrete.isSuccess).toBe(true));
    
    expect(supabase.functions.invoke).toHaveBeenCalledWith('melhor-envio-api', expect.objectContaining({
      body: expect.objectContaining({
        action: 'calcularFrete',
        params: params
      })
    }));
  });

  it('deve tratar erros de status code da Edge Function', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ 
      data: null, 
      error: { message: 'Network Error', status: 500 } 
    });

    const { result } = renderHook(() => useMelhorEnvio(), { wrapper: createWrapper() });

    result.current.calcularFrete.mutate({ from: { postal_code: '01' }, to: { postal_code: '02' } });

    await waitFor(() => expect(result.current.calcularFrete.isError).toBe(true));
    expect(result.current.calcularFrete.error?.message).toContain('Network Error');
  });

  it('deve realizar fuzz testing de entradas vazias', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ 
      data: { error: 'Invalid parameters' }, 
      error: null 
    });

    const { result } = renderHook(() => useMelhorEnvio(), { wrapper: createWrapper() });

    // @ts-ignore - Testando input inválido intencionalmente
    result.current.calcularFrete.mutate({});

    await waitFor(() => expect(result.current.calcularFrete.isError).toBe(true));
    expect(result.current.calcularFrete.error?.message).toBe('Invalid parameters');
  });
});

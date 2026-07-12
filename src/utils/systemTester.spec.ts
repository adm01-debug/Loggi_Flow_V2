import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSystemSanityChecks } from '../utils/systemTester';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      mfa: {
        listFactors: vi.fn(),
      },
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
    channel: vi.fn(() => ({
      subscribe: vi.fn((cb) => cb('SUBSCRIBED')),
    })),
    removeChannel: vi.fn(),
    storage: {
      listBuckets: vi.fn(),
    },
  },
}));

describe('System Integrity Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass all checks when system is healthy', async () => {
    (supabase.auth.getSession as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: { session: {} } });
    
    (supabase.from as unknown as { mockImplementation: (fn: (t: string) => unknown) => void }).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
        };
      }
      if (table === 'audit_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ count: 10, error: null })
        };
      }
      return { select: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    (supabase.functions.invoke as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: { status: 'healthy', checks: { database: true } }, error: null });
    (supabase.auth.mfa.listFactors as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: [], error: null });
    (supabase.storage.listBuckets as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: [], error: null });

    const results = await runSystemSanityChecks();
    const failures = results.filter(r => r.status !== 'PASS');
    
    expect(failures.length).toBe(0);
  });

  it('should detect database connectivity failure', async () => {
    (supabase.auth.getSession as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: { session: {} } });
    (supabase.from as unknown as { mockImplementation: (fn: (t: string) => unknown) => void }).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ error: { message: 'DB Error' } })
        };
      }
      return { select: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ count: 0, error: null }) };
    });

    const results = await runSystemSanityChecks();
    const dbCheck = results.find(r => r.name === "Conectividade de Banco");
    expect(dbCheck?.status).toBe('FAIL');
  });
});

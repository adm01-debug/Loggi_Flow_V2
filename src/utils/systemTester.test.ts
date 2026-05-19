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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          maybeSingle: vi.fn(),
          limit: vi.fn(() => ({
            count: vi.fn(),
          })),
        })),
      })),
    })),
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
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: {} } });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          limit: vi.fn().mockReturnValue({
             select: vi.fn().mockReturnThis(),
             count: 'exact',
             head: true,
             limit: vi.fn().mockResolvedValue({ count: 10, error: null })
          })
        }),
      }),
    });
    
    // Fix the nested mock for audit_logs
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({ limit: () => ({ maybeSingle: async () => ({ data: { id: 1 }, error: null }) }) })
        };
      }
      if (table === 'audit_logs') {
        return {
          select: () => ({ limit: () => ({ count: 10, error: null }) })
        };
      }
    });

    (supabase.functions.invoke as any).mockResolvedValue({ data: { status: 'healthy' }, error: null });
    (supabase.auth.mfa.listFactors as any).mockResolvedValue({ data: [], error: null });
    (supabase.storage.listBuckets as any).mockResolvedValue({ data: [], error: null });

    const results = await runSystemSanityChecks();
    const failures = results.filter(r => r.status !== 'PASS');
    
    expect(failures.length).toBe(0);
  });

  it('should detect database connectivity failure', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: {} } });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({ limit: () => ({ maybeSingle: async () => ({ error: { message: 'DB Error' } }) }) })
        };
      }
      return { select: () => ({ limit: () => ({ count: 0, error: null }) }) };
    });

    const results = await runSystemSanityChecks();
    const dbCheck = results.find(r => r.name === "Conectividade de Banco");
    expect(dbCheck?.status).toBe('FAIL');
  });
});

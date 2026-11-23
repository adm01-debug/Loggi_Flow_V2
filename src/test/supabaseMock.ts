import { vi } from "vitest";

export interface MockSupabaseResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
}

/** Cria um duplo encadeavel do cliente Supabase. */
export function createSupabaseMock<T = unknown>(
  result: MockSupabaseResult<T> = { data: null, error: null },
) {
  const resolved = Promise.resolve(result);

  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    // Promise-like para await direto
    then: (resolved as Promise<MockSupabaseResult<T>>).then.bind(resolved),
    catch: (resolved as Promise<MockSupabaseResult<T>>).catch.bind(resolved),
    finally: (resolved as Promise<MockSupabaseResult<T>>).finally.bind(resolved),
  };

  // Todos os metodos retornam o proprio chain exceto single/maybeSingle
  for (const key of Object.keys(chain)) {
    if (key !== "single" && key !== "maybeSingle" && key !== "then" && key !== "catch" && key !== "finally") {
      (chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    }
  }

  const fromMock = vi.fn().mockReturnValue(chain);

  return {
    supabase: { from: fromMock },
    fromMock,
    chain,
  };
}

/**
 * Instala o mock no modulo do cliente Supabase.
 * Use dentro de vi.mock():
 *
 *   const { supabase } = createSupabaseMock({ data: [...], error: null });
 *   vi.mock("@/integrations/supabase/client", () => ({ supabase }));
 */
export { createSupabaseMock as supabaseMock };
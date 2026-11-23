import { describe, it, expect, vi } from "vitest";
import { renderHookWithQuery } from "./renderWithQuery";
import { createSupabaseMock } from "./supabaseMock";

// Smoke test basico: renderHookWithQuery retorna resultado imediato
describe("renderWithQuery", () => {
  it("renderHookWithQuery executa hook com QueryClientProvider", () => {
    const { result } = renderHookWithQuery(() => ({ ok: true }));
    expect(result.current.ok).toBe(true);
  });
});

// Smoke test basico: createSupabaseMock responde corretamente
describe("supabaseMock", () => {
  it("from().select() resolve com data e error controlados", async () => {
    const { supabase } = createSupabaseMock({ data: [{ id: "1" }], error: null });
    const result = await supabase.from("tabela").select("*");
    expect(result.data).toEqual([{ id: "1" }]);
    expect(result.error).toBeNull();
  });

  it("suporta encadeamento sem quebrar", async () => {
    const { supabase } = createSupabaseMock({ data: [], error: null });
    const result = await supabase.from("tabela").select("*").eq("id", "1").order("created_at").limit(10);
    expect(result.data).toEqual([]);
  });

  it("single() resolve com o mesmo resultado", async () => {
    const { supabase } = createSupabaseMock({ data: { id: "42" }, error: null });
    const result = await supabase.from("tabela").select("*").eq("id", "42").single();
    expect((result.data as { id: string } | null)?.id).toBe("42");
  });

  it("vi.mock recebe supabase injetado corretamente", () => {
    const { supabase, fromMock } = createSupabaseMock({ data: null, error: { message: "not found" } });
    vi.mocked(supabase.from, true).mockReturnValue(
      supabase.from("x") as ReturnType<typeof supabase.from>,
    );
    supabase.from("test");
    expect(fromMock).toHaveBeenCalledWith("test");
  });
});
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";

// Etapa 277 do docs/qa/04-PLANO.md (achados H-13 e C-03): o caminho de conflito do
// controle de concorrencia nunca era exercitado. Sem { count: "exact" }, zero linhas
// atualizadas e indistinguivel de sucesso e o hook gravava kanban_history como se a
// alocacao tivesse ocorrido. Este teste trava o padrao de useBoxManagement.tsx:145-164.

const { fromMock, toastSuccess, toastError } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

import { useBoxManagement } from "./useBoxManagement";
import { renderHookWithQuery } from "@/test/renderWithQuery";

/** Duplo do Supabase: a leitura da fila, o update com versao e o historico sao controlados pelo teste. */
function montarBanco(resultado: { error?: unknown; count?: number }) {
  const insert = vi.fn((_payload: Record<string, unknown>) =>
    Promise.resolve({ error: null }),
  );
  const single = vi.fn(() =>
    Promise.resolve({ data: { status: "pronto_despacho" }, error: null }),
  );
  const limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
  const update = vi.fn(
    (_payload: Record<string, unknown>, _opcoes?: { count?: string }) => ({
      eq: () => ({ eq: () => Promise.resolve(resultado) }),
    }),
  );

  const leitura = {
    is: () => leitura,
    in: () => leitura,
    order: () => leitura,
    limit,
  };
  const select = vi.fn((colunas?: string) =>
    colunas === "status" ? { eq: () => ({ single }) } : leitura,
  );

  fromMock.mockImplementation((tabela: string) =>
    tabela === "kanban_history" ? { insert } : { select, update },
  );

  return { insert, update, single, limit };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("alocar entrega no BOX com controle de concorrencia", () => {
  it("count 1 (versao casou): aloca com { count: exact } e grava o historico", async () => {
    const banco = montarBanco({ error: null, count: 1 });
    const { result } = renderHookWithQuery(() => useBoxManagement());

    await act(async () => {
      await result.current.allocateToBox(3, "e-1", 7);
    });

    expect(banco.update).toHaveBeenCalledTimes(1);
    expect(banco.update.mock.calls[0][0]).toEqual({ box_alocado: "03" });
    expect(banco.update.mock.calls[0][1]).toEqual({ count: "exact" });

    expect(banco.insert).toHaveBeenCalledTimes(1);
    const historico = banco.insert.mock.calls[0][0] as unknown as Record<
      string,
      unknown
    >;
    expect(historico.delivery_id).toBe("e-1");
    expect(historico.notes).toBe("Alocado ao BOX 03");
    expect(toastSuccess).toHaveBeenCalledWith("Entrega alocada no BOX 03");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("count 0 (registro alterado por outro usuario): recusa e nao grava historico", async () => {
    const banco = montarBanco({ error: null, count: 0 });
    const { result } = renderHookWithQuery(() => useBoxManagement());

    await act(async () => {
      await expect(result.current.allocateToBox(3, "e-1", 7)).rejects.toThrow(
        /Conflito de versão/,
      );
    });

    expect(banco.update).toHaveBeenCalledTimes(1);
    // O dano do achado C-03: historico gravado como se a alocacao tivesse ocorrido.
    expect(banco.insert).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      "Erro ao alocar entrega no box",
      expect.objectContaining({ description: expect.stringMatching(/Conflito de versão/) }),
    );
  });

  it("erro do banco: repassa o motivo e nao grava historico", async () => {
    const banco = montarBanco({
      error: { message: "permission denied for table entregas" },
    });
    const { result } = renderHookWithQuery(() => useBoxManagement());

    await act(async () => {
      await expect(result.current.allocateToBox(1, "e-2", 3)).rejects.toThrow(
        /permission denied/,
      );
    });

    expect(banco.insert).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      "Erro ao alocar entrega no box",
      expect.objectContaining({ description: "permission denied for table entregas" }),
    );
  });
});
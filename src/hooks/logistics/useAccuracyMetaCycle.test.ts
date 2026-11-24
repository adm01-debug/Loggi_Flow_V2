import { describe, expect, it, vi, beforeEach } from "vitest";

// Etapa 218 do docs/qa/04-PLANO.md (achado P-03): o hook deixou de chamar a RPC uma vez por
// transportadora e passou a chamar a variante em lote. Como a migration chega ao banco depois do
// deploy deste codigo, o caminho de queda para a chamada antiga precisa continuar funcionando -- e
// e o que estes tres casos travam.

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

const LINHAS = [
  { transportadora: "A", target_pct: 90, consecutive_days_alert: 2 },
  { transportadora: null, target_pct: 95, consecutive_days_alert: 6 },
];

interface Resposta {
  data: unknown;
  error: unknown;
}

/** Duplo encadeavel: todo metodo devolve o proprio objeto e o `then` resolve a resposta da leitura. */
function cadeia(resposta: () => Resposta) {
  const alvo: Record<string, unknown> = {};
  Object.assign(alvo, {
    select: () => alvo,
    eq: () => alvo,
    gte: () => alvo,
    contains: () => alvo,
    order: () => alvo,
    limit: () => alvo,
    maybeSingle: () => alvo,
    single: () => alvo,
    then: (ok: (v: Resposta) => unknown, erro: (e: unknown) => unknown) =>
      Promise.resolve(resposta()).then(ok, erro),
    catch: (erro: (e: unknown) => unknown) => Promise.resolve(resposta()).catch(erro),
    finally: (fim: () => void) => Promise.resolve(resposta()).finally(fim),
  });
  return alvo;
}

beforeEach(() => {
  fromMock.mockReset();
  rpcMock.mockReset();
  fromMock.mockImplementation((tabela: string) => {
    if (tabela === "prediction_accuracy_settings") {
      return cadeia(() => ({ data: LINHAS, error: null }));
    }
    // `notifications` e lida duas vezes: a lista de notificadas (metadata) e a ultima (created_at).
    return cadeia(() => ({ data: [{ metadata: { carrier: "A" } }], error: null }));
  });
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
  },
}));

import { useAccuracyMetaCycle } from "./useAccuracyMetaCycle";
import { renderHookWithQuery } from "@/test/renderWithQuery";

async function ler() {
  const { result } = renderHookWithQuery(() => useAccuracyMetaCycle());
  await vi.waitFor(() => expect(result.current.isLoading).toBe(false));
  if (result.current.isError) throw result.current.error;
  return result.current.data!;
}

describe("useAccuracyMetaCycle (etapa 218)", () => {
  it("responde todos os pares numa unica chamada quando a variante em lote existe", async () => {
    rpcMock.mockImplementation((nome: string) => {
      expect(nome).toBe("count_prediction_breach_days_bulk");
      return Promise.resolve({
        data: [
          { carrier: "A", target: 90, breach_days: 3 },
          { carrier: null, target: 95, breach_days: 1 },
        ],
        error: null,
      });
    });

    const dados = await ler();

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock.mock.calls[0][1]).toEqual({
      _pairs: [
        { carrier: "A", target: 90 },
        { carrier: null, target: 95 },
      ],
    });
    expect(dados.items).toEqual([
      {
        transportadora: "A",
        target_pct: 90,
        consecutive_days_alert: 2,
        breach_days: 3,
        notified_in_cycle: true,
        status: "notified",
      },
      {
        transportadora: null,
        target_pct: 95,
        consecutive_days_alert: 6,
        breach_days: 1,
        notified_in_cycle: false,
        status: "warming",
      },
    ]);
  });

  it("cai na chamada antiga, uma por transportadora, quando a variante em lote falha", async () => {
    rpcMock.mockImplementation((nome: string) => {
      if (nome === "count_prediction_breach_days_bulk") {
        return Promise.resolve({ data: null, error: { message: "function not found" } });
      }
      return Promise.resolve({ data: 4, error: null });
    });

    const dados = await ler();

    expect(rpcMock.mock.calls.map((c) => c[0])).toEqual([
      "count_prediction_breach_days_bulk",
      "count_prediction_breach_days",
      "count_prediction_breach_days",
    ]);
    expect(rpcMock.mock.calls[1][1]).toEqual({ _target: 90, _carrier: "A" });
    expect(rpcMock.mock.calls[2][1]).toEqual({ _target: 95, _carrier: null });
    expect(dados.items.map((i) => i.breach_days)).toEqual([4, 4]);
    expect(dados.items.map((i) => i.status)).toEqual(["notified", "warming"]);
  });

  it("cai na chamada antiga quando o lote responde incompleto", async () => {
    rpcMock.mockImplementation((nome: string) => {
      if (nome === "count_prediction_breach_days_bulk") {
        return Promise.resolve({
          data: [{ carrier: "A", target: 90, breach_days: 7 }],
          error: null,
        });
      }
      return Promise.resolve({ data: 1, error: null });
    });

    const dados = await ler();

    expect(rpcMock).toHaveBeenCalledTimes(3);
    expect(dados.items.map((i) => i.breach_days)).toEqual([1, 1]);
  });
});

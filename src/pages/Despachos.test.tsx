import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Etapa 282 — mover entrega de status. A mutacao vive na pagina (Despachos.tsx:216-320),
// nao ha hook compartilhado com o Kanban (achado: as duas telas seguem separadas).
// Importar a pagina tambem a coloca no denominador da cobertura global (piso de 73% em
// vitest.config.ts), por isso o segundo bloco cobre os caminhos de tela que a cercam.

const {
  fromMock,
  toastSuccess,
  toastError,
  onStatusChangeMock,
  limitMock,
  audioMock,
  realtime,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  onStatusChangeMock: vi.fn(),
  limitMock: vi.fn(),
  audioMock: {
    playSuccess: vi.fn(),
    playWhoosh: vi.fn(),
    playNotification: vi.fn(),
  },
  realtime: {} as { insert?: () => void; update?: () => void },
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/hooks/logistics/useRuleTriggers", () => ({
  useRuleTriggers: () => ({ onStatusChange: onStatusChangeMock }),
}));

vi.mock("@/hooks/data/useRealtime", () => ({
  useRealtime: ({
    onInsert,
    onUpdate,
  }: {
    onInsert?: () => void;
    onUpdate?: () => void;
  }) => {
    realtime.insert = onInsert;
    realtime.update = onUpdate;
  },
}));

vi.mock("@/hooks/notifications/useAudioFeedback", () => ({
  useAudioFeedback: () => audioMock,
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

// Os dois dialogos sao substituidos por botoes que chamam o callback recebido: assim o
// teste alcanca "atualizar status", "fechar detalhes" e "fechar confirmacao" sem depender
// de portal nem de animacao.
vi.mock("@/components/shipping/ExpeditionDetailsDialog", () => ({
  ExpeditionDetailsDialog: ({
    delivery,
    onStatusUpdate,
    onOpenChange,
  }: {
    delivery: { id: string } | null;
    onStatusUpdate: () => void;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="detalhes">
      <span>{delivery?.id ?? "nenhuma"}</span>
      <button onClick={() => onStatusUpdate()}>atualizar-status</button>
      <button onClick={() => onOpenChange(false)}>fechar-detalhes</button>
    </div>
  ),
}));

vi.mock("@/components/common/ConfirmDialog", () => ({
  ConfirmDialog: ({
    open,
    onOpenChange,
    onConfirm,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
  }) => (
    <div data-testid="confirmar-despacho" data-open={String(open)}>
      <button onClick={() => onConfirm()}>autorizar-despacho</button>
      <button onClick={() => onOpenChange(false)}>cancelar-confirmacao</button>
    </div>
  ),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: fromMock },
}));

import Despachos from "./Despachos";
import { withQuery } from "@/test/renderWithQuery";

const entrega = (status = "pronto_despacho") => ({
  id: "e-1",
  numero_entrega: "ENT-00001234",
  status,
  nf_remessa: "NF-1" as string | null,
  box_alocado: "BOX-3",
  tags: ["urgente"],
  version: 7,
  endereco_entrega: "Rua A, 1",
  created_at: "2026-11-20T10:00:00.000Z",
  cliente: { razao_social: "Cliente X", nome_fantasia: null },
  transportadora: null,
});

/** Duplo do Supabase: a leitura da fila e a escrita de status sao controladas por teste. */
function montarBanco(
  item: ReturnType<typeof entrega>,
  resultado: { error?: unknown; count?: number },
) {
  limitMock.mockResolvedValue({ data: [item], error: null });
  const leitura = {
    select: () => leitura,
    in: () => leitura,
    is: () => leitura,
    order: () => leitura,
    limit: limitMock,
  };
  const escrita = {
    update: vi.fn((..._args: unknown[]) => ({
      eq: () => ({ eq: () => Promise.resolve(resultado) }),
    })),
    insert: vi.fn((..._args: unknown[]) => Promise.resolve({ error: null })),
  };
  fromMock.mockImplementation((tabela: string) =>
    tabela === "entregas" ? { ...leitura, ...escrita } : escrita,
  );
  return escrita;
}

beforeEach(() => {
  vi.clearAllMocks();
  onStatusChangeMock.mockResolvedValue(undefined);
});

const renderPagina = () => render(<Despachos />, { wrapper: withQuery() });

describe("mover entrega de status (Despachos)", () => {
  it("transicao permitida com count 1: um update com a versao lida, sucesso e a fila e recarregada", async () => {
    const banco = montarBanco(entrega(), { error: null, count: 1 });
    renderPagina();

    const botao = await screen.findByRole("button", { name: /PROSSEGUIR/ });
    fireEvent.click(botao);

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/Movido para/),
      ),
    );
    expect(banco.update).toHaveBeenCalledTimes(1);
    expect(banco.update.mock.calls[0][0]).toEqual({ status: "cotacao_frete" });
    expect(banco.update.mock.calls[0][1]).toEqual({ count: "exact" });
    expect(onStatusChangeMock).toHaveBeenCalledWith("entrega", "e-1", {
      status: "cotacao_frete",
    });
    await waitFor(() => expect(limitMock).toHaveBeenCalledTimes(2));
    expect(toastError).not.toHaveBeenCalled();
  });

  it("sem destino unico (despachado): nao oferece o botao e nao escreve", async () => {
    const banco = montarBanco(entrega("despachado"), { error: null, count: 1 });
    renderPagina();

    await screen.findByText(/NF_LINKED/);
    expect(screen.queryByRole("button", { name: /PROSSEGUIR/ })).toBeNull();
    expect(banco.update).not.toHaveBeenCalled();
  });

  it("count 0 (registro alterado por outro usuario): recusa com a mensagem de conflito, sem anunciar sucesso", async () => {
    const banco = montarBanco(entrega(), { error: null, count: 0 });
    renderPagina();

    fireEvent.click(await screen.findByRole("button", { name: /PROSSEGUIR/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/registro alterado por outro usu/),
      ),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(banco.update).toHaveBeenCalledTimes(1);
    expect(onStatusChangeMock).not.toHaveBeenCalled();
    expect(banco.insert).not.toHaveBeenCalled();
  });

  it("erro do banco: a mutacao rejeita e o motivo chega ao usuario, sem sucesso", async () => {
    const banco = montarBanco(entrega(), {
      error: { message: "permission denied for table entregas" },
    });
    renderPagina();

    fireEvent.click(await screen.findByRole("button", { name: /PROSSEGUIR/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "permission denied for table entregas",
      ),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(banco.update).toHaveBeenCalledTimes(1);
  });
});

describe("a tela em volta da mutacao (Despachos)", () => {
  it("Sincronizar recarrega a fila", async () => {
    montarBanco(entrega(), { error: null, count: 1 });
    renderPagina();

    await screen.findByText(/NF_LINKED/);
    fireEvent.click(screen.getByRole("button", { name: /Sincronizar/ }));

    await waitFor(() => expect(limitMock).toHaveBeenCalledTimes(2));
  });

  it("evento de tempo real: insert toca o aviso e atualizacao recarrega sem tocar som", async () => {
    montarBanco(entrega(), { error: null, count: 1 });
    renderPagina();

    await screen.findByText(/NF_LINKED/);
    realtime.insert?.();
    await waitFor(() => expect(limitMock).toHaveBeenCalledTimes(2));
    expect(audioMock.playNotification).toHaveBeenCalledTimes(1);

    realtime.update?.();
    await waitFor(() => expect(limitMock).toHaveBeenCalledTimes(3));
    expect(audioMock.playNotification).toHaveBeenCalledTimes(1);
  });

  it("clique no cartao abre os detalhes e o aviso de status recarrega a fila", async () => {
    montarBanco(entrega(), { error: null, count: 1 });
    renderPagina();

    fireEvent.click(await screen.findByText("Cliente X"));

    expect(audioMock.playWhoosh).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("detalhes").textContent).toContain("e-1");
    fireEvent.click(screen.getByRole("button", { name: "atualizar-status" }));
    await waitFor(() => expect(limitMock).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: "fechar-detalhes" }));
    fireEvent.click(
      screen.getByRole("button", { name: "cancelar-confirmacao" }),
    );
  });

  it("cartao mostra box e tags do registro", async () => {
    montarBanco(entrega(), { error: null, count: 1 });
    renderPagina();

    expect(await screen.findByText(/BOX_/)).toBeTruthy();
    expect(screen.getByText("urgente")).toBeTruthy();
  });

  it("erro na leitura: mostra o estado de erro e Tentar novamente refaz a consulta", async () => {
    montarBanco(entrega(), { error: null, count: 1 });
    limitMock.mockResolvedValue({
      data: null,
      error: { message: "permission denied for table entregas" },
    });
    renderPagina();

    expect(await screen.findByText(/Erro ao carregar despachos/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/ }));

    await waitFor(() => expect(limitMock).toHaveBeenCalledTimes(2));
  });
});

describe("despacho final (nf_emitida -> despachado)", () => {
  it("NF de simples remessa ausente: recusa antes de qualquer escrita", async () => {
    const banco = montarBanco(
      { ...entrega("nf_emitida"), nf_remessa: null },
      { error: null, count: 1 },
    );
    renderPagina();

    fireEvent.click(await screen.findByRole("button", { name: /PROSSEGUIR/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/NF de Simples Remessa obrigat/),
      ),
    );
    expect(banco.update).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("confirmar-despacho").getAttribute("data-open"),
    ).toBe("false");
  });

  it("pede confirmacao e, autorizada, grava o status com a versao lida e o historico", async () => {
    const banco = montarBanco(entrega("nf_emitida"), { error: null, count: 1 });
    renderPagina();

    fireEvent.click(await screen.findByRole("button", { name: /PROSSEGUIR/ }));
    await waitFor(() =>
      expect(
        screen.getByTestId("confirmar-despacho").getAttribute("data-open"),
      ).toBe("true"),
    );
    expect(banco.update).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "autorizar-despacho" }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "Entrega despachada com sucesso!",
      ),
    );
    expect(banco.update).toHaveBeenCalledTimes(1);
    expect(banco.update.mock.calls[0][0]).toMatchObject({
      status: "despachado",
    });
    expect(banco.update.mock.calls[0][1]).toEqual({ count: "exact" });
    expect(onStatusChangeMock).toHaveBeenCalledWith("entrega", "e-1", {
      status: "despachado",
    });
    const historico = banco.insert.mock.calls[0][0] as unknown as Record<
      string,
      unknown
    >;
    expect(historico.from_status).toBe("nf_emitida");
    expect(historico.to_status).toBe("despachado");
    expect(historico.notes).toBe("Despacho final autorizado");
    await waitFor(() => expect(limitMock).toHaveBeenCalledTimes(2));
  });

  it("despacho final com count 0: recusa com a mensagem de conflito", async () => {
    montarBanco(entrega("nf_emitida"), { error: null, count: 0 });
    renderPagina();

    fireEvent.click(await screen.findByRole("button", { name: /PROSSEGUIR/ }));
    fireEvent.click(screen.getByRole("button", { name: "autorizar-despacho" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/registro alterado por outro usu/),
      ),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});

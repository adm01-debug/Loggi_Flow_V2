import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Etapa 281 — a criacao de coleta mora no dialogo (nao ha hook): PickupDialog.tsx:162.
// O duplo do Supabase e o de src/test, mas o `insert` fica espionado para provar
// quantas escritas o clique gera (R-05) e o que vai no payload.

const { insertMock, fromMock, toastMock, onStatusChangeMock } = vi.hoisted(
  () => ({
    insertMock: vi.fn(),
    fromMock: vi.fn(),
    toastMock: vi.fn(),
    onStatusChangeMock: vi.fn(),
  }),
);

const dropdowns = {
  select: () => ({
    is: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
  }),
  update: () => ({ eq: () => Promise.resolve({ error: null }) }),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: fromMock },
}));

vi.mock("@/hooks/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/hooks/logistics/useRuleTriggers", () => ({
  useRuleTriggers: () => ({ onStatusChange: onStatusChangeMock }),
}));

import { PickupDialog } from "./PickupDialog";

const props = () => ({
  open: true,
  onOpenChange: vi.fn(),
  onSuccess: vi.fn((..._args: unknown[]) => undefined),
});

/** Preenche o formulario como o operador faz antes de clicar em INJETAR_COLETA_REDE. */
function preencher(endereco = "Rua das Coletas, 100 - Centro, Sao Paulo - SP") {
  fireEvent.change(screen.getByLabelText("Manifesto_ID"), {
    target: { value: "COL-TESTE1" },
  });
  fireEvent.change(screen.getByLabelText("Endereço de Origem"), {
    target: { value: endereco },
  });
}

const submit = () =>
  screen.getByRole("button", { name: /INJETAR_COLETA_REDE/ });

beforeEach(() => {
  vi.clearAllMocks();
  insertMock.mockResolvedValue({ error: null });
  fromMock.mockImplementation((tabela: string) =>
    tabela === "coletas"
      ? { insert: insertMock, update: dropdowns.update }
      : dropdowns,
  );
});

describe("PickupDialog — criar coleta", () => {
  it("entrada valida: um insert com os campos obrigatorios e a tela e avisada", async () => {
    const p = props();
    render(<PickupDialog {...p} />);
    preencher();
    fireEvent.click(submit());

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.numero_coleta).toBe("COL-TESTE1");
    expect(payload.endereco_coleta).toContain("Rua das Coletas");
    expect(payload.status).toBe("aguardando_liberacao");
    expect(payload.qtd_volumes).toBe(0);
    expect(payload.is_reverse).toBe(false);
    expect(payload.is_urgent).toBe(false);

    await waitFor(() => expect(p.onSuccess).toHaveBeenCalledTimes(1));
    expect(p.onOpenChange).toHaveBeenCalledWith(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Protocolo Injetado" }),
    );
  });

  it("campo obrigatorio ausente: rejeita antes do insert", async () => {
    const p = props();
    render(<PickupDialog {...p} />);
    fireEvent.click(submit());

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(insertMock).not.toHaveBeenCalled();
    expect(p.onSuccess).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });
  it("erro do banco: a mutacao rejeita, o usuario ve o motivo e a tela nao fecha", async () => {
    insertMock.mockResolvedValue({
      error: { message: "permission denied for table coletas" },
    });
    const p = props();
    render(<PickupDialog {...p} />);
    preencher();
    fireEvent.click(submit());

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          description: "permission denied for table coletas",
        }),
      ),
    );
    expect(p.onSuccess).not.toHaveBeenCalled();
    expect(p.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("duplo envio: o segundo clique enquanto o primeiro esta pendente nao gera outro insert", async () => {
    let liberar!: (v: { error: null }) => void;
    insertMock.mockReturnValue(
      new Promise<{ error: null }>((resolve) => {
        liberar = resolve;
      }),
    );
    const p = props();
    render(<PickupDialog {...p} />);
    preencher();

    fireEvent.click(submit());
    await waitFor(() =>
      expect((submit() as HTMLButtonElement).disabled).toBe(true),
    );
    fireEvent.click(submit());
    fireEvent.click(submit());

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    liberar({ error: null });
    await waitFor(() => expect(p.onSuccess).toHaveBeenCalledTimes(1));
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});

describe("PickupDialog — alternadores e cancelamento", () => {
  it("Reversa e Urgente entram no payload da coleta", async () => {
    const p = props();
    render(<PickupDialog {...p} />);
    fireEvent.click(screen.getByRole("button", { name: /Reversa/ }));
    fireEvent.click(screen.getByRole("button", { name: /Urgente/ }));
    preencher();
    fireEvent.click(submit());

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.is_reverse).toBe(true);
    expect(payload.is_urgent).toBe(true);
    expect(String(payload.observacoes)).toContain("[LOGÍSTICA_REVERSA]");
  });

  it("Inbound desliga a reversa antes do envio", async () => {
    const p = props();
    render(<PickupDialog {...p} />);
    fireEvent.click(screen.getByRole("button", { name: /Reversa/ }));
    fireEvent.click(screen.getByRole("button", { name: /Inbound/ }));
    preencher();
    fireEvent.click(submit());

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.is_reverse).toBe(false);
  });

  it("CANCELAR_LOG fecha o dialogo sem escrever nada", () => {
    const p = props();
    render(<PickupDialog {...p} />);
    fireEvent.click(screen.getByRole("button", { name: /CANCELAR_LOG/ }));

    expect(p.onOpenChange).toHaveBeenCalledWith(false);
    expect(insertMock).not.toHaveBeenCalled();
  });
});

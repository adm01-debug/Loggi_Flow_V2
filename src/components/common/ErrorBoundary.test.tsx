import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Etapa 285 — o crash de render do ErrorBoundary passa a ser gravado em
// `telemetry_logs` pela RPC `registrar_crash_ui`. Antes só existia no console de quem
// caiu, porque sem `VITE_SENTRY_DSN` a chamada ao Sentry é no-op (src/main.tsx:10).
// A RPC é o caminho que também atende usuário sem sessão (tela de login).

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: rpcMock },
}));

vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

import { ErrorBoundary } from "./ErrorBoundary";

function Explode(): JSX.Element {
  throw new Error("render explodiu");
}

function SemErro() {
  return <p>tela viva</p>;
}

describe("ErrorBoundary — registro de crash", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    consoleError.mockClear();
  });

  it("grava o crash em telemetry_logs com o contexto da tela", async () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    );

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock.mock.calls[0][0]).toBe("registrar_crash_ui");
    const payload = rpcMock.mock.calls[0][1];
    expect(payload).toMatchObject({
      p_message: "render explodiu",
      p_url: window.location.href,
    });
    expect(payload.p_stack_trace).toContain("render explodiu");
    expect(payload.p_metadata.componentStack).toContain("Explode");
    expect(payload.p_metadata.userAgent).toBe(navigator.userAgent);
    // A tela de erro continua aparecendo para o usuário final.
    expect(screen.getByText("Recuperação de Falha Crítica")).toBeInTheDocument();
  });

  it("não grava nada quando a tela renderiza sem erro", () => {
    render(
      <ErrorBoundary>
        <SemErro />
      </ErrorBoundary>,
    );

    expect(rpcMock).not.toHaveBeenCalled();
    expect(screen.getByText("tela viva")).toBeInTheDocument();
  });

  it("não deixa o crash do banco esconder a tela de erro", async () => {
    rpcMock.mockRejectedValue(new Error("rede caiu no meio do crash"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Recuperação de Falha Crítica")).toBeInTheDocument();
    warn.mockRestore();
    consoleError.mockClear();
  });
});
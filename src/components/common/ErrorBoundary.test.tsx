import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Etapa 285 — o crash de render do ErrorBoundary passa a ser gravado em
// `telemetry_logs` (ErrorBoundary.tsx:27). Antes só existia no console de quem
// caiu, porque sem `VITE_SENTRY_DSN` a chamada ao Sentry é no-op (src/main.tsx:10).

const { insertMock, fromMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: fromMock },
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
    fromMock.mockReset();
    insertMock.mockReset();
    fromMock.mockImplementation(() => ({ insert: insertMock }));
    insertMock.mockResolvedValue({ error: null });
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

    expect(fromMock).toHaveBeenCalledWith("telemetry_logs");
    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      severity: "error",
      category: "ui_crash",
      message: "render explodiu",
      url: window.location.href,
    });
    expect(payload.stack_trace).toContain("render explodiu");
    expect(payload.metadata.componentStack).toContain("Explode");
    expect(payload.device_info.userAgent).toBe(navigator.userAgent);
    // A tela de erro continua aparecendo para o usuário final.
    expect(screen.getByText("Recuperação de Falha Crítica")).toBeInTheDocument();
  });

  it("não grava nada quando a tela renderiza sem erro", () => {
    render(
      <ErrorBoundary>
        <SemErro />
      </ErrorBoundary>,
    );

    expect(fromMock).not.toHaveBeenCalled();
    expect(screen.getByText("tela viva")).toBeInTheDocument();
  });

  it("não deixa o crash do banco esconder a tela de erro", async () => {
    insertMock.mockRejectedValue(new Error("RLS recusou (sessão anônima)"));
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
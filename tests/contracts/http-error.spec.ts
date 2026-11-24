import { afterEach, describe, expect, it, vi } from "vitest";
import { internalErrorResponse } from "../../supabase/functions/_shared/httpError";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const CORS = { "Access-Control-Allow-Origin": "*" };

/** Texto de erro do Postgres: nome de tabela, coluna, restrição e policy de RLS. */
const PG_ERRO =
  'duplicate key value violates unique constraint "entregas_codigo_rastreio_key" em entregas.cliente_documento (policy rls_entregas_tenant)';

function silenciaConsole() {
  return {
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    info: vi.spyOn(console, "info").mockImplementation(() => {}),
  };
}

describe("internalErrorResponse", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devolve 500 com código genérico e sem o texto do Postgres", async () => {
    silenciaConsole();

    const resp = internalErrorResponse(
      new Error(PG_ERRO),
      CORS,
      "ingest-biosync",
    );
    const corpo = await resp.text();

    expect(resp.status).toBe(500);
    expect(JSON.parse(corpo)).toEqual({ error: "INTERNAL_ERROR" });
    expect(corpo).not.toContain("entregas");
    expect(corpo).not.toContain("policy");
    expect(corpo).not.toContain("duplicate key");
    expect(corpo).not.toContain("Error:");
  });

  it("registra o detalhe no log, com a tag da função", () => {
    const spies = silenciaConsole();

    internalErrorResponse(new Error(PG_ERRO), CORS, "ingest-biosync");

    expect(spies.error).toHaveBeenCalledTimes(1);
    const entrada = JSON.parse(spies.error.mock.calls[0][0] as string);
    expect(entrada.level).toBe("ERROR");
    expect(entrada.message).toBe("[ingest-biosync] Error:");
    expect(String(entrada.meta.error)).toContain(
      "entregas_codigo_rastreio_key",
    );
  });

  it("não devolve pilha de execução", async () => {
    silenciaConsole();

    const err = new Error("falha interna");
    const corpo = await internalErrorResponse(
      err,
      CORS,
      "lgpd-erase-user",
    ).text();

    expect(corpo).not.toContain("at ");
    expect(corpo).not.toContain(err.stack as string);
  });

  it("preserva os headers recebidos e sobrescreve só o Content-Type", async () => {
    silenciaConsole();

    const resp = internalErrorResponse(
      new Error("x"),
      { ...CORS, "X-Custom": "1" },
      "scheduled-reports",
    );

    expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(resp.headers.get("X-Custom")).toBe("1");
    expect(resp.headers.get("Content-Type")).toBe("application/json");
  });

  it("ValidationError vira 422 com o campo e não vai para o log de erro", async () => {
    const spies = silenciaConsole();

    const resp = internalErrorResponse(
      new ValidationError("email", "email is required"),
      CORS,
      "x",
    );
    const corpo = await resp.json();

    expect(resp.status).toBe(422);
    expect(corpo).toEqual({
      error: "Validation error",
      field: "email",
      message: "email is required",
    });
    expect(spies.error).not.toHaveBeenCalled();
  });
});

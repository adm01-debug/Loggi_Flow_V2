import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/resend-email/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoProvedor = entre(
  "const response = await safeFetch(",
  "return new Response(JSON.stringify({ success: true",
);
const blocoCatch = entre("  } catch (error) {", "\n});");

describe("resend-email: erro do provedor de e-mail nao chega ao chamador", () => {
  it("a resposta do Resend nao vira mensagem da excecao", () => {
    expect(src).not.toContain("data.error.message");
    expect(blocoProvedor).toContain(
      'throw new Error("Falha ao enviar o e-mail pelo provedor");',
    );
  });

  it("o corpo do provedor vai para o log, com o status e corte de tamanho", () => {
    expect(blocoProvedor).toContain(
      'log.error("[resend-email] Provedor recusou o envio:", {',
    );
    expect(blocoProvedor).toContain("status: response.status,");
    expect(blocoProvedor).toContain(
      "body: JSON.stringify(data).slice(0, 500),",
    );
  });

  it("o catch usa o helper da etapa 164, sem ecoar mensagem interna", () => {
    expect(blocoCatch).toContain(
      'return internalErrorResponse(error, headers, "resend-email");',
    );
    expect(blocoCatch).not.toContain("error.message");
    expect(src).not.toContain("error: error.message");
  });

  it("o ramo de entrada invalida (etapa 150) continua antes do helper", () => {
    expect(blocoCatch).toContain("if (error instanceof ValidationError) {");
    expect(blocoCatch).toContain(
      "return validationErrorResponse(error, headers);",
    );
    expect(blocoCatch.indexOf("validationErrorResponse")).toBeLessThan(
      blocoCatch.indexOf("internalErrorResponse"),
    );
  });

  it("o envio continua autenticado e validado antes de gastar chamada", () => {
    expect(src).toContain("requireInternalSecret(req)");
    expect(src).toContain('auth.claims.role !== "service_role"');
    expect(src.indexOf("parseEmailRequest(")).toBeLessThan(
      src.indexOf("api.resend.com"),
    );
  });

  it("o caminho de sucesso nao mudou", () => {
    expect(src).toContain("JSON.stringify({ success: true, id: data.id })");
    expect(src).toContain("if (data.error)");
  });
});

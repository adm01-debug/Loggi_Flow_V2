import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/rodonaves-webhook/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoCatch = entre("  } catch (error: any) {", "\n});");
const blocoUpdate = entre("    if (updateError) {", "\n    // Register ocorrencia");

describe("rodonaves-webhook: erro generico na resposta ao webhook", () => {
  it("a resposta de erro nao carrega a mensagem interna", () => {
    expect(src).not.toContain("error: error.message");
    expect(src).not.toContain("throw updateError");
    expect(blocoCatch).not.toContain("error.message })");
  });

  it("o catch usa o helper da etapa 164, mantendo 500 para a Rodonaves reenviar", () => {
    expect(blocoCatch).toContain(
      'return internalErrorResponse(error, headers, "rodonaves-webhook");',
    );
  });

  it("nao engole o evento: o catch nao responde 2xx nem finge sucesso", () => {
    expect(blocoCatch).not.toMatch(/status:\s*2\d\d/);
    expect(blocoCatch).not.toContain("success: true");
  });

  it("o erro do PostgREST do update vai para o log e o throw e de mensagem fixa", () => {
    expect(blocoUpdate).toContain("log.error(");
    expect(blocoUpdate).toContain("code: updateError.code,");
    expect(blocoUpdate).toContain("message: updateError.message,");
    expect(blocoUpdate).toContain('throw new Error("Falha ao atualizar a entrega");');
    expect(blocoUpdate).not.toContain("updateError.message);");
  });

  it("o detalhe do catch vai para o log como texto, nao como objeto do erro", () => {
    expect(blocoCatch).toContain('log.error("[rodonaves-webhook] Webhook error:", {');
    expect(blocoCatch).toContain(
      "message: error instanceof Error ? error.message : String(error),",
    );
    expect(src).not.toContain('log.error("Rodonaves webhook error:", error)');
  });

  it("a assinatura HMAC e o 401 continuam antes de qualquer gravacao", () => {
    expect(src).toContain('verifyWebhookHmac(raw, signature, "RODONAVES_WEBHOOK_SECRET")');
    expect(src).toContain('JSON.stringify({ error: "Invalid signature" })');
    expect(src.indexOf("await verifyWebhookHmac(")).toBeLessThan(
      src.indexOf('"webhook_events_processed"'),
    );
  });

  it("o marcador de idempotencia (etapa 135) continua antes do update da entrega", () => {
    expect(src.indexOf('"webhook_events_processed"')).toBeLessThan(
      src.indexOf("if (updateError) {"),
    );
  });

  it("o limite de taxa (429) continua antes da verificacao de assinatura", () => {
    expect(src).toContain('checkRateLimit(req, "rodonaves-webhook"');
    expect(src).toContain("status: 429,");
    expect(src.indexOf("checkRateLimit(req,")).toBeLessThan(
      src.indexOf("await verifyWebhookHmac("),
    );
  });
});

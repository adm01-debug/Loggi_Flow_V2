import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/lalamove-webhook/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoCatch = entre("  } catch (error: any) {", "\n});");

describe("lalamove-webhook: erro generico na resposta ao webhook", () => {
  it("a resposta de erro nao carrega a mensagem interna", () => {
    expect(src).not.toContain("error: error.message");
    expect(blocoCatch).not.toContain("error.message })");
  });

  it("o catch usa o helper da etapa 164, mantendo 500 para a Lalamove reenviar", () => {
    expect(blocoCatch).toContain(
      "return internalErrorResponse(error, corsHeaders, 'lalamove-webhook');",
    );
  });

  it("nao engole o evento: o catch nao responde 2xx nem finge sucesso", () => {
    expect(blocoCatch).not.toMatch(/status:\s*2\d\d/);
    expect(blocoCatch).not.toContain("success: true");
  });

  it("o detalhe vai para o log como texto, nao como objeto do erro", () => {
    expect(blocoCatch).toContain(
      "log.error('[lalamove-webhook] Webhook processing error:', {",
    );
    expect(blocoCatch).toContain(
      "message: error instanceof Error ? error.message : String(error),",
    );
    expect(src).not.toContain("log.error('Webhook processing error', { error: error.message })");
  });

  it("a assinatura HMAC e o 401 continuam antes de qualquer gravacao", () => {
    expect(src).toContain("await verifyWebhookHmac(payload, signature, 'LALAMOVE_API_SECRET')");
    expect(src).toContain("JSON.stringify({ error: 'Invalid signature' })");
    expect(src.indexOf("await verifyWebhookHmac(")).toBeLessThan(
      src.indexOf("'webhook_events_processed'"),
    );
  });

  it("a chave de idempotencia (etapa 139) segue deterministica e o marcador vem antes do switch", () => {
    expect(src).toContain("buildEventKey('lalamove', partesEvento)");
    expect(src.indexOf("'webhook_events_processed'")).toBeLessThan(
      src.indexOf("switch (eventType)"),
    );
  });

  it("o limite de taxa (429) continua antes da verificacao de assinatura", () => {
    expect(src).toContain(
      'checkRateLimit(req, "lalamove-webhook", { maxRequests: 100, windowMs: 60_000 })',
    );
    expect(src).toContain('status: 429,');
    expect(src.indexOf("checkRateLimit(req,")).toBeLessThan(
      src.indexOf("await verifyWebhookHmac("),
    );
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/nexus-webhook-receiver/index.ts",
);
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoCatch = entre("  } catch (error: any) {", "\n});");

describe("nexus-webhook-receiver: erro generico na resposta ao webhook", () => {
  it("a resposta de erro nao carrega a mensagem interna", () => {
    expect(src).not.toContain("error: error.message");
    expect(blocoCatch).not.toContain("success: false");
    expect(blocoCatch).not.toContain("error.message })");
  });

  it("o catch usa o helper da etapa 164, mantendo 500 para haver reenvio", () => {
    expect(blocoCatch).toContain(
      'return internalErrorResponse(error, headers, "nexus-webhook-receiver");',
    );
  });

  it("nao engole o evento: o catch nao responde 2xx nem finge sucesso", () => {
    expect(blocoCatch).not.toMatch(/status:\s*2\d\d/);
    expect(blocoCatch).not.toContain("success: true");
  });

  it("o detalhe vai para o log como texto, nao como objeto do erro", () => {
    expect(blocoCatch).toContain(
      "log.error('[nexus-webhook-receiver] Webhook processing error:', {",
    );
    expect(blocoCatch).toContain(
      "message: error instanceof Error ? error.message : String(error),",
    );
    expect(src).not.toContain("log.error('Webhook processing error:', error)");
  });

  it("a assinatura HMAC e o 401 continuam antes de qualquer processamento", () => {
    expect(src).toContain(
      'await verifyWebhookHmac(raw, signature, "NEXUS_WEBHOOK_SECRET")',
    );
    expect(src).toContain('JSON.stringify({ error: "Invalid signature" })');
    expect(src.indexOf("await verifyWebhookHmac(")).toBeLessThan(
      src.indexOf("claimIdempotencyKey("),
    );
  });

  it("a chave de idempotencia (etapa 140) segue deterministica e antes do invoke", () => {
    expect(src).toContain("buildEventKey(");
    expect(src).toContain("claimIdempotencyKey(eventKey.provider, eventKey.id)");
    expect(src.indexOf("claimIdempotencyKey(")).toBeLessThan(
      src.indexOf("await invokeFunction("),
    );
  });

  it("o limite de taxa (429) continua no inicio do handler", () => {
    expect(src).toContain(
      'checkRateLimit(req, "nexus-webhook-receiver", { maxRequests: 200, windowMs: 60_000 })',
    );
    expect(src).toContain('JSON.stringify({ error: "rate_limited" })');
    expect(src.indexOf("checkRateLimit(req,")).toBeLessThan(
      src.indexOf("await verifyWebhookHmac("),
    );
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fonte = readFileSync(
  join(process.cwd(), "supabase/functions/accuracy-meta-monitor/index.ts"),
  "utf8",
);

function entre(inicio: string, fim: string): string {
  const a = fonte.indexOf(inicio);
  expect(a).toBeGreaterThan(-1);
  const b = fonte.indexOf(fim, a);
  expect(b).toBeGreaterThan(a);
  return fonte.slice(a, b);
}

describe("accuracy-meta-monitor: canais externos com tempo limite", () => {
  it("nao usa mais functions.invoke e importa o helper", () => {
    expect(fonte).not.toMatch(/\.functions\.invoke\(/);
    expect(fonte).toContain(
      'import { invokeFunction } from "../_shared/invokeFunction.ts";',
    );
  });

  it("o e-mail sai pelo helper com tempo limite e o mesmo corpo", () => {
    const email = entre("if (channels.email) {", "const whatsappTarget");
    expect(email).toMatch(/invokeFunction\(\s*"resend-email",/);
    expect(email).toContain("to: channels.email,");
    expect(email).toContain("subject: payload.title,");
    expect(email).toContain("html: `<p>${payload.message}</p>");
    expect(email).toContain("{ timeoutMs: DISPATCH_TIMEOUT_MS },");
  });

  it("o whatsapp sai pelo helper com tempo limite e o mesmo corpo", () => {
    const zap = entre("if (whatsappTarget) {", "if (Object.keys(dispatched)");
    expect(zap).toMatch(/invokeFunction\(\s*"whatsapp-notification",/);
    expect(zap).toContain('action: "send_custom",');
    expect(zap).toContain('template: "accuracy_meta_alert",');
    expect(zap).toContain("phone: whatsappTarget,");
    expect(zap).toContain("title: payload.title + escalationSuffix,");
    expect(zap).toContain("{ timeoutMs: DISPATCH_TIMEOUT_MS },");
  });

  it("registra o motivo curto da falha, sem mensagem crua nem throw", () => {
    expect(fonte).toContain(
      'dispatched.email = envioEmail.ok ? "ok" : `error:${envioEmail.reason}`;',
    );
    const zap = entre("if (whatsappTarget) {", "if (Object.keys(dispatched)");
    expect(zap).toContain("await invokeFunction");
    expect(zap).toContain("? `error:${envioWhatsapp.reason}`");
    expect(fonte).not.toContain("eErr");
    expect(fonte).not.toContain("wErr");
    expect(fonte).not.toContain("throw:");
  });

  it("o tempo limite dos dois envios e de 10 s", () => {
    expect(fonte).toMatch(/const DISPATCH_TIMEOUT_MS = 10_000;/);
  });
});

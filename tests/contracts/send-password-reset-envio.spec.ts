import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/send-password-reset/index.ts",
);
const src = readFileSync(EDGE, "utf8");

function trechoDoEnvio(): string {
  const inicio = src.indexOf("const envio = await invokeFunction(");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("const { error: updateError }", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("send-password-reset: envio do e-mail com tempo limite", () => {
  it("nao usa mais functions.invoke e chama o helper com 5 s", () => {
    expect(src).not.toMatch(/\.functions\.invoke\(/);
    expect(src).toContain(
      'import { invokeFunction } from "../_shared/invokeFunction.ts";',
    );
    expect(src).toMatch(/const SEND_EMAIL_TIMEOUT_MS = 5_000;/);
    expect(trechoDoEnvio()).toContain("{ timeoutMs: SEND_EMAIL_TIMEOUT_MS }");
  });

  it("nao devolve o erro do envio para a tela", () => {
    const trecho = trechoDoEnvio();
    expect(trecho).not.toContain("Failed to send reset email");
    expect(trecho).not.toMatch(/status:\s*500/);
    expect(src).toContain(
      'JSON.stringify({ success: true, message: "Password reset email sent" })',
    );
  });

  it("registra o motivo da falha em log, sem lancar", () => {
    expect(src).toMatch(
      /if \(!envio\.ok\) \{\s*log\.error\("Error sending reset email:", \{ reason: envio\.reason \}\);\s*\}/,
    );
  });

  it("mantem o corpo e o link que o resend-email ja recebia", () => {
    const trecho = trechoDoEnvio();
    expect(trecho).toContain("to: resetRequest.email");
    expect(trecho).toContain('subject: "Redefinição de senha — LogiFlow"');
    expect(trecho).toContain("html: `<p>");
    expect(trecho).toContain("${actionLink}");
    expect(trecho).not.toContain("body:");
  });
});

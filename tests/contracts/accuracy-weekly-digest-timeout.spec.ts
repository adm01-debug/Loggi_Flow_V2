import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fonte = readFileSync(
  join(process.cwd(), "supabase/functions/accuracy-weekly-digest/index.ts"),
  "utf8",
);

function blocoDoEnvio(): string {
  const inicio = fonte.indexOf("const envio = await invokeFunction(");
  expect(inicio).toBeGreaterThan(-1);
  const fim =
    fonte.indexOf("if (Object.keys(dispatched)", inicio) > -1
      ? fonte.indexOf("if (Object.keys(dispatched)", inicio)
      : fonte.indexOf("return new Response", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return fonte.slice(inicio, fim);
}

describe("accuracy-weekly-digest: envio com tempo limite", () => {
  it("nao usa mais functions.invoke e importa o helper", () => {
    expect(fonte).not.toMatch(/\.functions\.invoke\(/);
    expect(fonte).toContain(
      'import { invokeFunction } from "../_shared/invokeFunction.ts";',
    );
  });

  it("envia pelo helper com tempo limite e o mesmo corpo", () => {
    const envio = blocoDoEnvio();
    expect(envio).toMatch(/invokeFunction\(\s*"resend-email",/);
    expect(envio).toContain(
      "{ to: r.email, subject: email.subject, html: email.html },",
    );
    expect(envio).toContain("{ timeoutMs: DIGEST_EMAIL_TIMEOUT_MS },");
  });

  it("registra o motivo curto da falha em vez da mensagem crua", () => {
    const envio = blocoDoEnvio();
    expect(envio).toMatch(/if \(!envio\.ok\) \{/);
    expect(envio).toContain("detail: envio.reason,");
    expect(fonte).not.toContain("eErr");
    expect(fonte).not.toContain("catch (e) {");
  });

  it("mantem o caminho de sucesso igual (auditoria na notifications)", () => {
    const envio = blocoDoEnvio();
    expect(envio).toContain(
      'results.push({ user_id: r.user_id, status: "sent" });',
    );
    expect(envio).toContain('source: "accuracy-weekly-digest",');
    expect(envio).toContain("alerts: report.totalAlerts,");
    expect(envio).not.toContain("throw ");
  });

  it("o tempo limite do envio e de 10 s", () => {
    expect(fonte).toMatch(/const DIGEST_EMAIL_TIMEOUT_MS = 10_000;/);
  });
});

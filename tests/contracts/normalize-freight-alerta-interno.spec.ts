import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/normalize-freight-response/index.ts",
);

const src = readFileSync(EDGE, "utf8");

function trechoDoAlerta(): string {
  const inicio = src.indexOf("let falhas = 0;");
  const fim = src.indexOf("Alertas de normalização não entregues");
  expect(inicio).toBeGreaterThan(-1);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, src.indexOf("}", fim) + 1);
}

describe("normalize-freight-response: alerta por WhatsApp", () => {
  it("chama a função interna pelo helper com tempo limite, sem fetch cru", () => {
    expect(src).not.toMatch(/await fetch\(/);
    expect(src).toContain(
      'import { invokeFunction } from "../_shared/invokeFunction.ts";',
    );
    expect(trechoDoAlerta()).toContain(
      'await invokeFunction("whatsapp-notification", {',
    );
  });

  it("mantém a mensagem e os campos que a função de WhatsApp já recebia", () => {
    const trecho = trechoDoAlerta();
    expect(trecho).toContain('action: "send_normalization_alert"');
    expect(trecho).toContain("phone,");
    expect(trecho).toContain('transportadora: "Nexus Engine"');
    expect(trecho).toContain('cotacao_id: "Internal"');
  });

  it("falha de um usuário não interrompe os outros e é contada", () => {
    const trecho = trechoDoAlerta();
    expect(trecho).toContain("if (!phone) continue;");
    expect(trecho).toMatch(/if \(!envio\.ok\) \{\s*falhas \+= 1;/);
    expect(trecho).toContain("reason: envio.reason");
    expect(trecho).not.toMatch(/throw /);
  });

  it("registra o resumo só quando houve falha", () => {
    expect(src).toContain("if (falhas > 0) {");
    expect(src).toContain("log.warn(");
    expect(src).toContain("total: usersToNotify.length,");
  });
});

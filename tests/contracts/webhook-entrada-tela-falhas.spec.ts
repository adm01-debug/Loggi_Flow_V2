import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Etapa 289: registrar a falha de webhook de entrada (etapa 288) sem mostrar nao
// resolve o achado H-14. A tela de /webhooks passa a listar as falhas de entrada.
describe("etapa 289 - falhas de webhook de entrada na tela de /webhooks", () => {
  const hook = readFileSync(
    join(process.cwd(), "src/hooks/integrations/useClientWebhooks.tsx"),
    "utf8",
  );
  const tela = readFileSync(
    join(process.cwd(), "src/components/integrations/WebhookManager.tsx"),
    "utf8",
  );

  it("a consulta le webhook_inbound_failures com teto explicito de linhas", () => {
    const bloco = hook.slice(hook.indexOf(".from('webhook_inbound_failures')"));
    expect(bloco.length).toBeGreaterThan(0);
    expect(bloco.indexOf(".limit(")).toBeGreaterThan(0);
    expect(bloco.indexOf(".limit(")).toBeLessThan(bloco.indexOf("enabled:"));
  });

  it("a tela expoe estado de carregando, de erro e de lista vazia", () => {
    expect(tela).toContain("inboundFailures");
    expect(tela).toContain("isLoadingInboundFailures");
    expect(tela).toContain("isErrorInboundFailures");
    expect(tela).toContain("Nenhuma falha registrada");
  });
});

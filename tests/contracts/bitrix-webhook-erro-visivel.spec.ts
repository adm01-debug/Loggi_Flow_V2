import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fonte = readFileSync(
  join(process.cwd(), "supabase/functions/bitrix24-integration/index.ts"),
  "utf8",
);

// Prova em runtime (2026-11-26): com um webhook salvo em bitrix_sync_config que responde
// HTML, `test-connection` devolvia 500 INTERNAL_ERROR - a mesma tela generica que esconde a
// causa. O painel de integracao precisa dizer o que aconteceu com o webhook.
describe("test-connection explica a falha do webhook do Bitrix", () => {
  it("distingue rede, corpo nao-JSON e HTTP sem detalhe", () => {
    expect(fonte).toContain("webhook do Bitrix inalcancavel");
    expect(fonte).toContain(
      "webhook do Bitrix respondeu HTML/texto (HTTP ${response.status})",
    );
    expect(fonte).toContain(
      "webhook do Bitrix respondeu HTTP ${response.status} sem detalhe",
    );
  });

  it("registra a causa no log em vez de so devolver erro generico", () => {
    expect(fonte).toContain(
      'log.error("bitrix24-integration: webhook inalcancavel"',
    );
    expect(fonte).toContain(
      'log.error("bitrix24-integration: webhook respondeu corpo nao-JSON"',
    );
  });

  it("le o corpo como texto antes de tentar JSON", () => {
    expect(fonte).toContain("const texto = await response.text();");
    expect(fonte).toContain("data = JSON.parse(texto);");
  });
});

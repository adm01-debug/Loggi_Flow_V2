import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/rodonaves-api/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoApiGet = entre("async function apiGet(", "return res.json();");
const blocoApiMutate = entre(
  "async function apiMutate(",
  "const text = await res.text();",
);
const blocoProtocolos = entre(
  "async function getDeliveryReceiptByProtocols(",
  "return res.json();",
);
const blocoHandler = entre("  } catch (error: unknown) {", "\n});");

describe("rodonaves-api: detalhe do parceiro so no log", () => {
  it("apiGet nao repassa o corpo nem o status do parceiro na mensagem", () => {
    expect(blocoApiGet).not.toContain("]: ${await res.text()}");
    expect(blocoApiGet).not.toContain("failed [${res.status}]");
    expect(blocoApiGet.split("await res.text()").length - 1).toBe(1);
  });

  it("apiGet registra gateway, caminho e status no log, com corte de tamanho", () => {
    expect(blocoApiGet).toContain(
      'log.error("[rodonaves-api] Falha no gateway RTE (GET):", {',
    );
    expect(blocoApiGet).toContain("path,");
    expect(blocoApiGet).toContain("status: res.status,");
    expect(blocoApiGet).toContain("body: body.slice(0, 500),");
  });

  it("apiMutate faz o mesmo, identificando o metodo HTTP", () => {
    expect(blocoApiMutate).not.toContain("]: ${await res.text()}");
    expect(blocoApiMutate).not.toContain("failed [${res.status}]");
    expect(blocoApiMutate).toContain(
      'log.error("[rodonaves-api] Falha no gateway RTE (mutacao):", {',
    );
    expect(blocoApiMutate).toContain("method,");
    expect(blocoApiMutate).toContain("body: body.slice(0, 500),");
  });

  it("comprovantes por protocolos lanca mensagem fixa", () => {
    expect(blocoProtocolos).not.toContain("${await res.text()}");
    expect(blocoProtocolos).toContain("body: body.slice(0, 500),");
    expect(blocoProtocolos).toContain(
      'throw new Error("Falha ao buscar comprovantes por protocolos");',
    );
  });

  it("a resposta de erro usa o texto do codigo que nos lancamos, nao o do parceiro", () => {
    expect(blocoHandler).toContain("error: MENSAGEM_POR_CODIGO[error.code],");
    expect(blocoHandler).not.toContain("error: error.message");
    expect(blocoHandler).toContain("code: error.code,");
    expect(blocoHandler).toContain("gateway: error.gateway,");
  });

  it("o erro inesperado passa pelo helper da etapa 164, sem ecoar mensagem", () => {
    expect(blocoHandler).toContain(
      'return internalErrorResponse(error, corsHeaders, "rodonaves-api");',
    );
    expect(blocoHandler).not.toContain(
      "error instanceof Error ? error.message",
    );
    expect(src).not.toContain("[${res.status}]");
    expect(src).not.toContain(": ${await res.text()}");
  });

  it("o mapa cobre os cinco codigos, com mensagem em portugues", () => {
    const mapa = entre(
      'const MENSAGEM_POR_CODIGO: Record<RTEError["code"], string> = {',
      "};",
    );
    for (const codigo of [
      "RTE_AUTH_FAILED",
      "RTE_SCOPE_BLOCKED",
      "RTE_TIMEOUT",
      "RTE_BAD_REQUEST",
      "RTE_UPSTREAM_ERROR",
    ]) {
      expect(mapa).toMatch(new RegExp(`${codigo}: "[^"]{20,}",`));
    }
    expect(mapa).not.toContain("${");
  });
});

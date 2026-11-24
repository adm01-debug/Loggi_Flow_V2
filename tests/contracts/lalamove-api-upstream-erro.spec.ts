import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/lalamove-api/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoUpstream = entre("if (!response.ok) {", "return response.json()");
const blocoDoCatch = entre("} catch (error) {", "\n  }\n})");

describe("lalamove-api: resposta de erro do parceiro nao chega ao chamador", () => {
  it("o 4xx do parceiro nao devolve o corpo cru", () => {
    expect(src).not.toContain("details: errorText");
    expect(src).not.toContain("details:");
    expect(blocoUpstream).toContain(
      "message: 'Transportadora recusou a solicitacao',",
    );
    expect(blocoUpstream.split("errorText").length - 1).toBe(3);
  });

  it("o corpo do parceiro vai para o log, com o status HTTP dele", () => {
    expect(blocoUpstream).toContain(
      "log.error('Lalamove upstream error', {\n        status: response.status,\n        errorText: errorText.slice(0, 500),",
    );
  });

  it("o catch nao ecoa a mensagem do erro nem texto do parceiro", () => {
    expect(blocoDoCatch).not.toContain("error: error.message,");
    expect(blocoDoCatch).not.toContain("details");
    expect(blocoDoCatch).toContain("? 'Transportadora indisponivel'");
    expect(blocoDoCatch).toContain(": 'Falha ao chamar a transportadora',");
    expect(blocoDoCatch).toContain("circuitOpen: isBreaker,");
    expect(blocoDoCatch).toContain("status: isBreaker ? 503 : 500,");
  });

  it("o disjuntor continua sendo disparado pelo erro do parceiro", () => {
    expect(blocoUpstream).toContain("if (response.status >= 500) {");
    expect(blocoUpstream).toContain(
      "throw new Error(`Lalamove Server Error: ${response.status}`);",
    );
    expect(src).toContain("error.message.includes('Circuit Breaker')");
  });

  it("payload invalido segue 422 e a chamada ao parceiro nao mudou", () => {
    expect(src).toContain("if (error instanceof ValidationError) {");
    expect(src).toContain("return validationErrorResponse(error, corsHeaders)");
    expect(src).toContain("safeFetch(`${LALAMOVE_BASE_URL}${path}`, {");
    expect(src).toContain("const errorText = await response.text()");
  });
});

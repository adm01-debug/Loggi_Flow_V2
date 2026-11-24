import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/smart-carrier-selection/index.ts",
);
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoCatch = entre("  } catch (error) {", "\n});");

describe("smart-carrier-selection: erro generico na resposta da cotacao", () => {
  it("a resposta de erro nao carrega a mensagem interna", () => {
    expect(src).not.toContain("message: error.message");
    expect(src).not.toContain('error: "Internal Server Error"');
  });

  it("o catch usa o helper da etapa 164, mantendo 500", () => {
    expect(blocoCatch).toContain(
      'return internalErrorResponse(error, corsHeaders, "smart-carrier-selection");',
    );
    expect(src).toContain(
      'import { internalErrorResponse } from "../_shared/httpError.ts";',
    );
  });

  it("erro de validacao continua respondendo 400 com o campo, antes do 500", () => {
    expect(blocoCatch).toContain("if (error instanceof ValidationError) {");
    expect(blocoCatch).toContain(
      "return validationErrorResponse(error, corsHeaders);",
    );
    expect(blocoCatch.indexOf("validationErrorResponse")).toBeLessThan(
      blocoCatch.indexOf("internalErrorResponse"),
    );
  });

  it("nao disfarca falha de sistema de resultado vazio", () => {
    expect(blocoCatch).not.toContain("success: true");
    expect(blocoCatch).not.toContain("recommendations");
    expect(blocoCatch).not.toMatch(/status:\s*2\d\d/);
  });

  it("a regra de escolha de transportadora e os pesos default seguem intactos", () => {
    expect(src).toContain("parseSmartSelectionInput(body)");
    expect(src).toContain('.from("freight_selection_rules")');
    expect(src).toContain("price_weight: 0.5");
    expect(src).toContain("time_weight: 0.3");
    expect(src).toContain("performance_weight: 0.2");
    expect(src).toContain("max_sla_days: 15");
  });

  it("o caminho de sucesso continua devolvendo as recomendacoes", () => {
    expect(src).toContain(
      "return new Response(JSON.stringify({ success: true, recommendations }), {",
    );
    expect(src).toContain('message: "Smart carrier selection completed"');
  });

  it("o detalhe do erro segue registrado no log", () => {
    expect(blocoCatch).toContain('message: "Smart carrier selection function error"');
    expect(blocoCatch).toContain("level: LogLevel.ERROR");
  });
});

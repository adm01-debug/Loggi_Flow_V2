import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseSmartSelectionInput } from "../../supabase/functions/smart-carrier-selection/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(
  process.cwd(),
  "supabase/functions/smart-carrier-selection/index.ts",
);

function erro(body: Record<string, unknown>): ValidationError {
  try {
    parseSmartSelectionInput(body);
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("esperava ValidationError");
}

describe("smart-carrier-selection: entrada validada (etapa 146 / B-04)", () => {
  it("normaliza a UF para maiúscula e mantém o peso numérico", () => {
    const out = parseSmartSelectionInput({
      estado_destino: " sp ",
      peso_kg: 12.5,
    });
    expect(out.estado_destino).toBe("SP");
    expect(out.peso_kg).toBe(12.5);
    expect(out.urgencia).toBeUndefined();
    expect(out.tipo_carga).toBeUndefined();
  });

  it("aceita peso 0 (limite inferior válido) sem confundir com ausente", () => {
    expect(
      parseSmartSelectionInput({ estado_destino: "RJ", peso_kg: 0 }).peso_kg,
    ).toBe(0);
  });

  it("rejeita peso não numérico em vez de calcular com NaN/0", () => {
    const e = erro({ estado_destino: "SP", peso_kg: "abc" });
    expect(e).toBeInstanceOf(ValidationError);
    expect(e.field).toBe("peso_kg");
  });

  it("rejeita peso ausente, nulo, vazio, coleção, booleano e negativo", () => {
    for (const peso of [undefined, null, "", "   ", [], {}, true]) {
      expect(erro({ estado_destino: "SP", peso_kg: peso }).field).toBe(
        "peso_kg",
      );
    }
    expect(erro({ estado_destino: "SP", peso_kg: -1 }).message).toContain(
      ">= 0",
    );
  });

  it("rejeita UF ausente, curta, longa, vazia ou não alfabética", () => {
    for (const uf of [
      undefined,
      null,
      "",
      "  ",
      "S",
      "SPX",
      "12",
      42,
      ["SP"],
    ]) {
      expect(erro({ estado_destino: uf, peso_kg: 1 }).field).toBe(
        "estado_destino",
      );
    }
  });

  it("mantém urgencia/tipo_carga opcionais e recusa tipo errado", () => {
    const ok = parseSmartSelectionInput({
      estado_destino: "mg",
      peso_kg: 3,
      urgencia: "urgente",
      tipo_carga: "carga_geral",
    });
    expect(ok.estado_destino).toBe("MG");
    expect(ok.urgencia).toBe("urgente");
    expect(ok.tipo_carga).toBe("carga_geral");
    expect(
      erro({ estado_destino: "MG", peso_kg: 3, urgencia: 123 }).field,
    ).toBe("urgencia");
  });

  it("devolve só os campos do contrato — nada do corpo vaza para o cálculo", () => {
    const out = parseSmartSelectionInput({
      estado_destino: "BA",
      peso_kg: 5,
      is_default: true,
      price_weight: 99,
      select: "*",
    });
    expect(Object.keys(out).sort()).toEqual([
      "estado_destino",
      "peso_kg",
      "tipo_carga",
      "urgencia",
    ]);
  });

  it("a edge valida antes de consultar as tabelas e devolve 422, nunca 500", () => {
    const fonte = readFileSync(EDGE, "utf8");

    expect(fonte).toContain("parseSmartSelectionInput(body)");
    expect(fonte.indexOf("parseSmartSelectionInput(body)")).toBeLessThan(
      fonte.indexOf('.from("tabelas_frete")'),
    );
    expect(fonte).toContain("if (error instanceof ValidationError) {");
    expect(fonte).toContain(
      "return validationErrorResponse(error, corsHeaders);",
    );
  });
});

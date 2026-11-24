import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBioSyncInput } from "../../supabase/functions/ingest-biosync/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(process.cwd(), "supabase/functions/ingest-biosync/index.ts");

const leitura = { driver_id: "d1", vehicle_id: "v1", heart_rate: 132 };

function erro(body: Record<string, unknown>): ValidationError {
  try {
    parseBioSyncInput(body);
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("esperava ValidationError");
}

describe("ingest-biosync: heart_rate validado (etapa 148 / B-04)", () => {
  it("aceita leitura válida e preserva os campos do contrato", () => {
    expect(parseBioSyncInput({ ...leitura, fatigue_index: "HIGH" })).toEqual({
      driver_id: "d1",
      vehicle_id: "v1",
      heart_rate: 132,
      fatigue_index: "HIGH",
    });
  });

  it("aceita os limites fisiológicos 20 e 300", () => {
    expect(parseBioSyncInput({ ...leitura, heart_rate: 20 }).heart_rate).toBe(
      20,
    );
    expect(parseBioSyncInput({ ...leitura, heart_rate: 300 }).heart_rate).toBe(
      300,
    );
  });

  it("recusa texto no batimento em vez de decidir o alerta por coerção", () => {
    const e = erro({ ...leitura, heart_rate: "abc" });
    expect(e).toBeInstanceOf(ValidationError);
    expect(e.field).toBe("heart_rate");
  });

  it("recusa batimento ausente, vazio, booleano, coleção e fora da faixa", () => {
    for (const heart_rate of [
      undefined,
      null,
      "",
      "   ",
      true,
      [],
      {},
      19,
      301,
      -5,
    ]) {
      expect(erro({ ...leitura, heart_rate }).field).toBe("heart_rate");
    }
  });

  it("aceita número em texto numérico e devolve número para a comparação", () => {
    expect(
      parseBioSyncInput({ ...leitura, heart_rate: "150" }).heart_rate,
    ).toBe(150);
  });

  it("exige vehicle_id e driver_id: sem eles o alerta não identifica veículo nem motorista", () => {
    for (const vehicle_id of [undefined, null, "", "  ", 42, ["v1"]]) {
      expect(erro({ ...leitura, vehicle_id }).field).toBe("vehicle_id");
    }
    for (const driver_id of [undefined, null, "", "  ", 42, ["d1"]]) {
      expect(erro({ ...leitura, driver_id }).field).toBe("driver_id");
    }
  });

  it("mantém fatigue_index com padrão LOW e normaliza espaços", () => {
    const out = parseBioSyncInput({
      driver_id: " d1 ",
      vehicle_id: " v1 ",
      heart_rate: 80,
    });

    expect(out).toEqual({
      driver_id: "d1",
      vehicle_id: "v1",
      heart_rate: 80,
      fatigue_index: "LOW",
    });
    expect(
      parseBioSyncInput({ ...leitura, fatigue_index: "" }).fatigue_index,
    ).toBe("LOW");
    expect(erro({ ...leitura, fatigue_index: 7 }).field).toBe("fatigue_index");
  });

  it("a edge valida antes de comparar com os limiares e devolve 422", () => {
    const fonte = readFileSync(EDGE, "utf8");

    expect(fonte).toContain("parseBioSyncInput(body)");
    expect(fonte.indexOf("parseBioSyncInput(body)")).toBeLessThan(
      fonte.indexOf("criticalThreshold)"),
    );
    expect(fonte).not.toContain("heart_rate ?? null");
    expect(fonte).not.toContain('fatigue_index || "LOW"');
    expect(fonte).toContain("heart_rate, // validado");
    // O 422 do ValidationError agora sai de _shared/httpError.ts (etapas 164/165).
    expect(fonte).toContain(
      'return internalErrorResponse(error, headers, "ingest-biosync");',
    );
    expect(fonte).not.toContain("if (error instanceof ValidationError) {");
  });
});

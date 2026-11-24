import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/ingest-biosync/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoDoInsert = entre(
  "const { data: telemetry, error } = await supabaseClient",
  "// 3. Proactive Tactical Log",
);
const blocoDoCatch = entre("} catch (error) {", "});");

describe("ingest-biosync: erro do banco não vaza para o chamador", () => {
  it("a resposta de erro passa pelo helper, sem montar o corpo à mão", () => {
    expect(src).toContain(
      'import { internalErrorResponse } from "../_shared/httpError.ts";',
    );
    expect(blocoDoCatch).toContain(
      'return internalErrorResponse(error, headers, "ingest-biosync");',
    );
    expect(blocoDoCatch).not.toContain("error.message");
    expect(src).not.toContain("JSON.stringify({ error: error.message })");
  });

  it("não sobra ramo de validação duplicado no catch", () => {
    expect(blocoDoCatch).not.toContain("ValidationError");
    expect(src).not.toContain(
      'import { ValidationError, validationErrorResponse } from "../_shared/validate.ts";',
    );
  });

  it("falha do insert não lança o erro cru do PostgREST", () => {
    expect(blocoDoInsert).toContain(
      'throw new Error("Falha ao gravar telemetria");',
    );
    expect(blocoDoInsert).not.toContain("throw error;");
    expect(blocoDoInsert).not.toContain("details:");
  });

  it("o detalhe do Postgres vai para o log, só código e mensagem", () => {
    expect(blocoDoInsert).toContain(
      'log.error("[ingest-biosync] Falha ao gravar telemetria:", {',
    );
    expect(blocoDoInsert).toContain("code: error.code,");
    expect(blocoDoInsert).toContain("message: error.message,");
    expect(blocoDoInsert).not.toContain("hint:");
  });

  it("o log da falha não carrega batimento nem identificador de motorista", () => {
    const logDaFalha = entre(
      'log.error("[ingest-biosync] Falha ao gravar telemetria:"',
      "});",
    );
    expect(logDaFalha).not.toContain("heart_rate");
    expect(logDaFalha).not.toContain("driver_id");
    expect(logDaFalha).not.toContain("vehicle_id");
  });

  it("o caminho de sucesso segue devolvendo a telemetria gravada", () => {
    expect(src).toContain("return new Response(JSON.stringify(telemetry), {");
    expect(src).toContain("status: 200,");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/scheduled-reports/index.ts",
);
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoDoCatch = entre("} catch (error) {", "};");
const blocoDoInsert = entre(
  ".insert([{ ...campos, user_id: userId }])",
  'case "update": {',
);

describe("scheduled-reports: erro do banco não vaza para o chamador", () => {
  it("o catch delega para o helper e não monta corpo de erro à mão", () => {
    expect(blocoDoCatch).toContain(
      'return internalErrorResponse(error, corsHeaders, "scheduled-reports");',
    );
    expect(blocoDoCatch).not.toContain("error.message");
    expect(blocoDoCatch).not.toContain("Unknown error");
    expect(src).not.toContain("error instanceof Error ? error.message");
  });

  it("o 422 do payload inválido continua saindo do helper, sem ramo duplicado", () => {
    expect(
      src.includes(
        'import { internalErrorResponse } from "../_shared/httpError.ts";',
      ),
    ).toBe(true);
    expect(blocoDoCatch).not.toContain("validationErrorResponse");
    expect(src).not.toContain(
      "return validationErrorResponse(error, corsHeaders);",
    );
  });

  it("o insert do relatório não lança o erro cru do PostgREST", () => {
    expect(blocoDoInsert).toContain(
      'throw new Error("Falha ao criar relatório");',
    );
    expect(blocoDoInsert).not.toContain("throw error;");
    expect(blocoDoInsert).not.toContain("details:");
    expect(blocoDoInsert).not.toContain("error.code }");
  });

  it("o detalhe do Postgres vai para o log, só código e mensagem", () => {
    expect(blocoDoInsert).toContain(
      'log.error("[Scheduled Reports] Falha ao criar relatório:", {',
    );
    expect(blocoDoInsert).toContain("code: error.code,");
    expect(blocoDoInsert).toContain("message: error.message,");
    expect(blocoDoInsert).not.toContain("hint:");
  });

  it("IDOR e resposta de sucesso continuam como antes", () => {
    expect(src).toContain("const userId = auth.claims.sub;");
    expect(src).toContain('.eq("user_id", userId)');
    expect(src).toContain("JSON.stringify({ success: true, report: data })");
    expect(src).toContain("status: 400");
  });

  it("payload inválido segue tipado como ValidationError", () => {
    expect(src).toContain("throw new ValidationError(");
    expect(src).toContain("requireString,");
  });
});

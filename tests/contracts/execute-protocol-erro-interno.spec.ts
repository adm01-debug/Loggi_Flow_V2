import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/execute-protocol/index.ts",
);
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoDoCatch = entre("} catch (error) {", "\n  }\n});");
const blocoDoRpc = entre(
  "if (error) {",
  "return new Response(JSON.stringify(data)",
);
const blocoDoPayload = entre(
  "if (!vehicle_id || !protocol_name) {",
  "const { data, error }",
);

describe("execute-protocol: erro do banco nao vaza para o chamador", () => {
  it("o catch delega para o helper e nao devolve a mensagem do Postgres", () => {
    expect(blocoDoCatch).toContain(
      'return internalErrorResponse(error, headers, "execute-protocol");',
    );
    expect(blocoDoCatch).not.toContain("error.message");
    expect(blocoDoCatch).not.toContain("status: 400");
    expect(src).not.toContain("error.details");
    expect(src).not.toContain("error.hint");
  });

  it("o rpc nao lanca o erro cru do PostgREST", () => {
    expect(blocoDoRpc).toContain(
      'throw new Error("Falha ao executar protocolo");',
    );
    expect(src).not.toContain("if (error) throw error;");
  });

  it("o log registra o protocolo que falhou, so codigo e mensagem", () => {
    expect(blocoDoRpc).toContain("protocol_name,");
    expect(blocoDoRpc).toContain("code: error.code,");
    expect(blocoDoRpc).toContain("message: error.message,");
    expect(blocoDoRpc).not.toContain("details:");
    expect(blocoDoRpc).not.toContain("hint:");
    expect(src).toContain('import { log } from "../_shared/logger.ts";');
  });

  it("corpo incompleto segue 400 e sem corpo interno", () => {
    expect(blocoDoPayload).toContain(
      'return new Response(\n        JSON.stringify({ error: "vehicle_id and protocol_name are required" }),',
    );
    expect(blocoDoPayload).toContain("status: 400,");
  });

  it("auth e a chamada do protocolo nao mudaram", () => {
    expect(src).toContain(
      'await supabase.auth.getUser(authHeader.replace("Bearer ", ""));',
    );
    expect(src).toContain(
      "const { vehicle_id, protocol_name } = await req.json();",
    );
    expect(src).toContain(
      'const { data, error } = await supabase.rpc("execute_nexus_protocol", {',
    );
    expect(src).toContain("return new Response(JSON.stringify(data), {");
    expect(src).toContain("const headers = getCorsHeaders(req);");
  });
});

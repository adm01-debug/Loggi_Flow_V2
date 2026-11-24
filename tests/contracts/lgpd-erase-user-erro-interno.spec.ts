import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/lgpd-erase-user/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoDoCatch = entre("} catch (error) {", "\n  }\n});");
const passoPerfil = entre("if (profileError) {", "// 2. Delete the auth user");
const passoAuth = entre("if (deleteAuthError) {", "// 3. Registrar no log");
const passoAuditoria = entre("if (auditError) {", "return new Response(");

describe("lgpd-erase-user: erro do banco nao vaza para o chamador", () => {
  it("o catch delega para o helper e nao devolve a mensagem do Postgres", () => {
    expect(blocoDoCatch).toContain(
      'return internalErrorResponse(error, corsHeaders, "lgpd-erase-user");',
    );
    expect(blocoDoCatch).not.toContain("error.message");
    expect(blocoDoCatch).not.toContain("status: 400");
    expect(src).not.toContain("error.details");
    expect(src).not.toContain("error.hint");
  });

  it("cada passo do apagamento registra em qual passo a rotina parou", () => {
    expect(passoPerfil).toContain('step: "profiles.delete",');
    expect(passoAuth).toContain('step: "auth.users.delete",');
    expect(passoAuditoria).toContain('step: "audit_logs.insert",');
    expect(src).toContain('import { log } from "../_shared/logger.ts";');
  });

  it("o detalhe do Postgres vai para o log, so codigo e mensagem", () => {
    for (const [bloco, nome] of [
      [passoPerfil, "profileError"],
      [passoAuth, "deleteAuthError"],
      [passoAuditoria, "auditError"],
    ] as const) {
      expect(bloco).toContain(`code: ${nome}.code,`);
      expect(bloco).toContain(`message: ${nome}.message,`);
      expect(bloco).not.toContain("details:");
      expect(bloco).not.toContain("hint:");
    }
  });

  it("nenhum passo lanca o erro cru do PostgREST", () => {
    for (const nome of ["profileError", "deleteAuthError", "auditError"]) {
      expect(src).not.toContain(`throw ${nome};`);
    }
    expect(passoPerfil).toContain('throw new Error("Falha ao apagar perfil");');
    expect(passoAuth).toContain('throw new Error("Falha ao apagar usu');
    expect(passoAuditoria).toContain(
      'throw new Error("Falha ao registrar auditoria do apagamento");',
    );
  });

  it("a ordem do apagamento e o alvo do titular nao mudaram", () => {
    const iPerfil = src.indexOf('.from("profiles")');
    const iAuth = src.indexOf("auth.admin.deleteUser");
    const iAuditoria = src.indexOf('.from("audit_logs")');
    expect(iPerfil).toBeGreaterThan(-1);
    expect(iAuth).toBeGreaterThan(iPerfil);
    expect(iAuditoria).toBeGreaterThan(iAuth);
    expect(src).toContain('.eq("id", userId)');
    expect(src).toContain("const { userId } = await req.json();");
  });

  it("payload sem userId segue 400 e sem corpo interno", () => {
    expect(src).toContain(
      'return new Response(JSON.stringify({ error: "User ID is required" }), {',
    );
    expect(src).toContain("status: 400,");
  });
});

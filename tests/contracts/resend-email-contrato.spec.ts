import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_HTML_LENGTH,
  MAX_RECIPIENTS,
  MAX_SUBJECT_LENGTH,
  parseEmailRequest,
} from "../../supabase/functions/resend-email/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(process.cwd(), "supabase/functions/resend-email/index.ts");

const email = {
  to: "cliente@promobrindes.com.br",
  subject: "Digest",
  html: "<p>oi</p>",
};

function erro(body: Record<string, unknown>): ValidationError {
  try {
    parseEmailRequest(body);
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("esperava ValidationError");
}

describe("resend-email: contrato antes de gastar envio (etapa 150 / B-04)", () => {
  it("aceita os três campos como os chamadores reais enviam", () => {
    expect(parseEmailRequest(email)).toEqual({
      to: ["cliente@promobrindes.com.br"],
      subject: "Digest",
      html: "<p>oi</p>",
      from: undefined,
    });
  });

  it("preserva lista de destinatários, validando cada endereço", () => {
    const dois = ["a@b.com", "c@d.com"];
    expect(parseEmailRequest({ ...email, to: dois }).to).toEqual(dois);
  });

  it("recusa destinatário malformado em vez de deixar o Resend cobrar o erro", () => {
    for (const to of [
      undefined,
      null,
      "",
      "   ",
      "semarroba",
      "a@b",
      "a b@c.com",
      "a@b c.com",
      "@b.com",
      "a@.com",
      42,
      ["a@b.com", "semarroba"],
      [""],
      [],
      Array.from({ length: MAX_RECIPIENTS + 1 }, (_, i) => `u${i}@b.com`),
    ]) {
      expect(erro({ ...email, to }).field).toBe("to");
    }
  });

  it("recusa assunto vazio ou acima do teto", () => {
    expect(
      erro({ ...email, subject: "x".repeat(MAX_SUBJECT_LENGTH + 1) }).field,
    ).toBe("subject");
    for (const subject of [undefined, null, "", "   ", 7, ["a"]]) {
      expect(erro({ ...email, subject }).field).toBe("subject");
    }
    expect(
      parseEmailRequest({ ...email, subject: "x".repeat(MAX_SUBJECT_LENGTH) })
        .subject,
    ).toHaveLength(MAX_SUBJECT_LENGTH);
  });

  it("recusa corpo vazio ou acima do teto de tamanho", () => {
    for (const html of [undefined, null, "", "   ", 7, ["<p>"]]) {
      expect(erro({ ...email, html }).field).toBe("html");
    }
    expect(
      erro({ ...email, html: "x".repeat(MAX_HTML_LENGTH + 1) }).field,
    ).toBe("html");
    expect(
      parseEmailRequest({ ...email, html: "x".repeat(MAX_HTML_LENGTH) }).html,
    ).toHaveLength(MAX_HTML_LENGTH);
  });

  it("aceita remetente com nome e recusa remetente inválido ou com quebra de linha", () => {
    expect(
      parseEmailRequest({
        ...email,
        from: "LogiFlow <no-reply@promobrindes.com.br>",
      }).from,
    ).toBe("LogiFlow <no-reply@promobrindes.com.br>");
    expect(
      parseEmailRequest({ ...email, from: "no-reply@promobrindes.com.br" })
        .from,
    ).toBe("no-reply@promobrindes.com.br");
    for (const from of [
      "invalido",
      "a@b",
      "x@y.com\r\nBcc: outro@z.com",
      "Nome <a@b>",
      42,
      ["a@b.com"],
    ]) {
      expect(erro({ ...email, from }).field).toBe("from");
    }
  });

  it("a edge valida antes do safeFetch e mantém o bloco de auth", () => {
    const fonte = readFileSync(EDGE, "utf8");

    expect(fonte).toContain("parseEmailRequest(");
    expect(fonte.indexOf("parseEmailRequest(")).toBeLessThan(
      fonte.indexOf("api.resend.com"),
    );
    expect(fonte).not.toContain("Array.isArray(to)");
    expect(fonte).toContain("        to,\n");
    expect(fonte).toContain("requireInternalSecret(req)");
    expect(fonte).toContain('auth.claims.role !== "service_role"');
    expect(fonte).toContain("if (error instanceof ValidationError) {");
    expect(fonte).toContain(
      "return validationErrorResponse(error, headers);",
    );
  });
});

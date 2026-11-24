import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ALLOWED_ACTIONS,
  parseWebhookStatusInput,
} from "../../supabase/functions/webhook-status/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(process.cwd(), "supabase/functions/webhook-status/index.ts");

const dataCompleto = {
  entrega_id: "e1",
  old_status: "coletada",
  new_status: "em_transito",
  numero_entrega: "N-1",
  codigo_rastreamento: "BR123",
};

function erro(body: Record<string, unknown>): ValidationError {
  try {
    parseWebhookStatusInput(body);
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("esperava ValidationError");
}

describe("webhook-status: entrada validada (etapa 147 / B-04)", () => {
  it("preserva os campos de data em notify_status_change", () => {
    const out = parseWebhookStatusInput({
      action: "notify_status_change",
      data: dataCompleto,
    });

    expect(out).toEqual({
      action: "notify_status_change",
      data: dataCompleto,
    });
  });

  it("recusa corpo sem data em vez de devolver 500", () => {
    const e = erro({ action: "notify_status_change" });
    expect(e).toBeInstanceOf(ValidationError);
    expect(e.field).toBe("data");
  });

  it("recusa data nulo, em lista ou com tipo errado", () => {
    for (const data of [null, [], "texto", 3, true]) {
      expect(erro({ action: "notify_status_change", data }).field).toBe("data");
    }
  });

  it("exige entrega_id: sem ele não há notificação identificável", () => {
    const resto: Record<string, unknown> = { ...dataCompleto };
    delete resto.entrega_id;
    expect(erro({ action: "notify_status_change", data: resto }).field).toBe(
      "entrega_id",
    );
    expect(
      erro({
        action: "notify_status_change",
        data: { ...resto, entrega_id: "" },
      }).field,
    ).toBe("entrega_id");
  });

  it("exige new_status: sem ele nenhum webhook casa a inscrição", () => {
    for (const new_status of [undefined, "", "  ", 123, {}, ["em_transito"]]) {
      expect(
        erro({
          action: "notify_status_change",
          data: { ...dataCompleto, new_status },
        }).field,
      ).toBe("new_status");
    }
  });

  it("mantém os campos informativos opcionais", () => {
    const out = parseWebhookStatusInput({
      action: "notify_status_change",
      data: { entrega_id: "e1", new_status: "entregue" },
    });

    expect(out).toEqual({
      action: "notify_status_change",
      data: {
        entrega_id: "e1",
        new_status: "entregue",
        old_status: undefined,
        numero_entrega: undefined,
        codigo_rastreamento: undefined,
      },
    });
  });

  it("normaliza espaços nas bordas dos campos de texto", () => {
    const out = parseWebhookStatusInput({
      action: "notify_status_change",
      data: { entrega_id: " e1 ", new_status: " entregue ", old_status: " x " },
    });

    expect(out).toMatchObject({
      data: { entrega_id: "e1", new_status: "entregue", old_status: "x" },
    });
  });

  it("recusa action ausente ou fora da lista", () => {
    for (const action of [
      undefined,
      null,
      "",
      "xpto",
      "Notify",
      42,
      ["list_webhooks"],
    ]) {
      expect(erro({ action }).field).toBe("action");
    }
    expect(ALLOWED_ACTIONS).toEqual(["notify_status_change", "list_webhooks"]);
  });

  it("list_webhooks não exige data", () => {
    expect(parseWebhookStatusInput({ action: "list_webhooks" })).toEqual({
      action: "list_webhooks",
    });
  });

  it("a edge valida antes de usar e devolve 422, nunca 500", () => {
    const fonte = readFileSync(EDGE, "utf8");

    expect(fonte).toContain("parseWebhookStatusInput(");
    expect(fonte.indexOf("parseWebhookStatusInput(")).toBeLessThan(
      fonte.indexOf("switch (parsed.action)"),
    );
    expect(fonte).toContain("} = parsed.data;");
    expect(fonte).not.toContain("} = data;");
    expect(fonte).toContain("if (error instanceof ValidationError) {");
    expect(fonte).toContain(
      "return validationErrorResponse(error, headers);",
    );
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ALLOWED_PATHS,
  parseLalamoveRoute,
} from "../../supabase/functions/lalamove-api/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(process.cwd(), "supabase/functions/lalamove-api/index.ts");

function erro(body: Record<string, unknown>): ValidationError {
  try {
    parseLalamoveRoute(body);
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("esperava ValidationError");
}

describe("lalamove-api: path/method por lista fechada (etapa 149 / B-04)", () => {
  it("aceita as quatro rotas que o app usa e monta o caminho da Lalamove", () => {
    expect(parseLalamoveRoute({ path: "/quotations", method: "POST" })).toEqual(
      {
        route: "quotation",
        orderId: null,
        upstreamPath: "/v3/quotations",
      },
    );
    expect(parseLalamoveRoute({ path: "/orders", method: "POST" })).toEqual({
      route: "create_order",
      orderId: null,
      upstreamPath: "/v3/orders",
    });
    expect(
      parseLalamoveRoute({ path: "/orders/ABC123", method: "GET" }),
    ).toEqual({
      route: "get_order",
      orderId: "ABC123",
      upstreamPath: "/v3/orders/ABC123",
    });
    expect(
      parseLalamoveRoute({ path: "/orders/ABC123/cancel", method: "PUT" }),
    ).toEqual({
      route: "cancel_order",
      orderId: "ABC123",
      upstreamPath: "/v3/orders/ABC123/cancel",
    });
  });

  it("tolera barra final, espaços e o prefixo /v3 sem aceitar caminho novo", () => {
    expect(
      parseLalamoveRoute({ path: " /orders/ABC123/ ", method: "GET" })
        .upstreamPath,
    ).toBe("/v3/orders/ABC123");
    expect(
      parseLalamoveRoute({ path: "/v3/orders/ABC123/cancel", method: "PUT" })
        .route,
    ).toBe("cancel_order");
    expect(
      parseLalamoveRoute({ path: "/v3/quotations", method: "POST" }).route,
    ).toBe("quotation");
  });

  it("recusa verbo que não é o da rota, mesmo com caminho válido", () => {
    expect(erro({ path: "/quotations", method: "GET" }).field).toBe("method");
    expect(erro({ path: "/orders", method: "PUT" }).field).toBe("method");
    expect(erro({ path: "/orders/ABC123", method: "POST" }).field).toBe(
      "method",
    );
    expect(erro({ path: "/orders/ABC123/cancel", method: "GET" }).field).toBe(
      "method",
    );
  });

  it("recusa verbo fora da lista fechada ou ausente", () => {
    for (const method of [undefined, null, "", "DELETE", "get", "PATCH", 42]) {
      expect(erro({ path: "/quotations", method }).field).toBe("method");
    }
  });

  it("recusa caminho fora da lista (era proxy aberto para a API do parceiro)", () => {
    for (const path of [
      undefined,
      null,
      "",
      "   ",
      "/qualquer",
      "quotations",
      "/orders/ABC123/track",
      "/orders/ABC123/finish",
      "/v2/orders",
      "/v3/quotations?serviceType=MOTORCYCLE",
      "/orders/ABC123/../cancel",
      "/orders/../../v3/orders",
      42,
      ["/orders"],
    ]) {
      expect(erro({ path, method: "POST" }).field).toBe("path");
    }
  });

  it("recusa identificador de pedido que não seja id, sem montar caminho com o texto", () => {
    for (const id of [
      "../cancel",
      "1?foo=bar",
      "1%2Fcancel",
      "a b",
      "ab/cd",
      "-1",
      "x".repeat(65),
    ]) {
      const e = erro({ path: `/orders/${id}`, method: "GET" });
      expect(e.field).toBe("path");
    }
  });

  it("lista fechada está publicada no módulo para quem for auditar", () => {
    expect(ALLOWED_PATHS).toEqual([
      "/quotations",
      "/orders",
      "/orders/{id}",
      "/orders/{id}/cancel",
    ]);
  });

  it("a edge roteia pela rota validada, não por substring do corpo", () => {
    const fonte = readFileSync(EDGE, "utf8");

    expect(fonte).toContain("parseLalamoveRoute(body)");
    expect(fonte).not.toContain("pathParts");
    expect(fonte).not.toContain("routePath");
    expect(fonte).not.toContain("routeMethod");
    expect(fonte).toContain("if (route === 'quotation') {");
    expect(fonte).toContain("if (route === 'create_order') {");
    expect(fonte).toContain("if (route === 'get_order') {");
    expect(fonte).toContain("if (route === 'cancel_order') {");
    expect(fonte).toContain("lalamoveRequest('GET', upstreamPath)");
    expect(fonte).toContain("lalamoveRequest('PUT', upstreamPath)");
    expect(fonte).toContain("if (error instanceof ValidationError) {");
    expect(fonte).toContain(
      "return validationErrorResponse(error, corsHeaders)",
    );
  });
});

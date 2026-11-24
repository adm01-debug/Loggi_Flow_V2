import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ID_FORMAT,
  MAX_ID_LENGTH,
  parseDriverId,
  parseOrderId,
} from "../../supabase/functions/lalamove-tracking/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(
  process.cwd(),
  "supabase/functions/lalamove-tracking/index.ts",
);

function erro(call: () => unknown): ValidationError {
  try {
    call();
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("esperava ValidationError");
}

describe("lalamove-tracking: identificador de rastreio (etapa 152 / B-04)", () => {
  it("aceita o orderId que a Lalamove devolve", () => {
    expect(parseOrderId({ orderId: "1234567890123456789" })).toBe(
      "1234567890123456789",
    );
  });

  it("aceita identificador com hífen e sublinhado dentro do teto", () => {
    const id = "ORD-2026_0001";
    expect(parseOrderId({ orderId: id })).toBe(id);
    expect(parseDriverId({ driverId: id })).toBe(id);
  });

  it("recusa chamada sem orderId", () => {
    expect(erro(() => parseOrderId({ action: "getOrderDetails" })).field).toBe(
      "orderId",
    );
  });

  it("recusa orderId com barra ou travessia de caminho", () => {
    for (const ruim of ["../orders/1", "1/2", "1?x=1", "1 2", ".1"]) {
      expect(erro(() => parseOrderId({ orderId: ruim })).field).toBe("orderId");
    }
  });

  it("recusa orderId acima do teto de 64 caracteres", () => {
    const longo = "1".repeat(MAX_ID_LENGTH + 1);
    expect(erro(() => parseOrderId({ orderId: longo })).field).toBe("orderId");
    expect(parseOrderId({ orderId: "1".repeat(MAX_ID_LENGTH) })).toHaveLength(
      MAX_ID_LENGTH,
    );
  });

  it("recusa chamada sem driverId", () => {
    const e = erro(() =>
      parseDriverId({
        orderId: "1234567890123456789",
        action: "getDriverLocation",
      }),
    );
    expect(e.field).toBe("driverId");
  });

  it("recusa driverId com caractere fora do formato", () => {
    expect(erro(() => parseDriverId({ driverId: "drv/1" })).field).toBe(
      "driverId",
    );
    expect(erro(() => parseDriverId({ driverId: "drv 1" })).field).toBe(
      "driverId",
    );
  });

  it("trata corpo que não é objeto como identificador ausente", () => {
    expect(erro(() => parseOrderId(undefined)).field).toBe("orderId");
    expect(erro(() => parseOrderId(["123"])).field).toBe("orderId");
    expect(erro(() => parseDriverId("123")).field).toBe("driverId");
  });

  it("a edge valida por ação e responde 422", () => {
    const src = readFileSync(EDGE, "utf8");
    // "test" (healthcheck de useIntegrationValidation.tsx:24) não pede identificador
    expect(src).not.toMatch(/const \{[^}]*orderId[^}]*\} = body;/);
    // as duas ações que usam o pedido passam pelo parse
    expect(src.match(/const orderId = parseOrderId\(body\);/g)).toHaveLength(2);
    expect(src).not.toContain("body.orderId");
    expect(src).toContain("const driverId = parseDriverId(body);");
    expect(src).not.toContain("driverId is required");
    expect(src).toContain("validationErrorResponse(error, corsHeaders)");
    expect(ID_FORMAT.test("../etc")).toBe(false);
  });
});

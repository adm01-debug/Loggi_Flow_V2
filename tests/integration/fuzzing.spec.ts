import { describe, it, expect } from "vitest";
import {
  requireString,
  requireNumber,
  ValidationError,
} from "../../supabase/functions/_shared/validate";

describe("Edge Function Fuzzing Suite (real _shared validators)", () => {
  it("should reject invalid UUIDs and malformed required strings", () => {
    const invalidUUIDs = [
      "123",
      "abc-123",
      "",
      "null",
      "undefined",
      "00000000-0000-0000-0000-000000000000",
    ];
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    invalidUUIDs.forEach((uuid) => {
      expect(uuidPattern.test(uuid)).toBe(false);
      // O mesmo padrao, agora via requireString com pattern, rejeita em producao:
      expect(() =>
        requireString({ id: uuid }, "id", { pattern: uuidPattern }),
      ).toThrow(ValidationError);
    });
  });

  it("should reject malformed JSON and non-numeric required fields via production logic", () => {
    const malformedPayloads = [
      '{"unclosed": "brace"',
      "invalid json",
      '{"type": "missing_quote}',
    ];
    malformedPayloads.forEach((payload) => {
      expect(() => JSON.parse(payload)).toThrow();
    });

    // requireNumber e o caminho real: rejeita nao numerico.
    expect(() => requireNumber({ price: "abc" }, "price")).toThrow(
      ValidationError,
    );
    expect(() => requireNumber({ price: "not-a-number" }, "price")).toThrow(
      ValidationError,
    );
    // Aceita string numerica valida.
    expect(requireNumber({ price: "42.5" }, "price")).toBe(42.5);
  });
});

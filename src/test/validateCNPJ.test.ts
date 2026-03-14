import { describe, it, expect } from "vitest";
import { validateCNPJDigits } from "@/lib/validations";

describe("validateCNPJDigits", () => {
  it("validates correct CNPJs", () => {
    // Known valid CNPJs
    expect(validateCNPJDigits("11222333000181")).toBe(true);
    expect(validateCNPJDigits("11.222.333/0001-81")).toBe(true);
  });

  it("rejects all-same-digit CNPJs", () => {
    expect(validateCNPJDigits("00000000000000")).toBe(false);
    expect(validateCNPJDigits("11111111111111")).toBe(false);
    expect(validateCNPJDigits("99999999999999")).toBe(false);
  });

  it("rejects CNPJs with wrong check digits", () => {
    expect(validateCNPJDigits("11222333000182")).toBe(false);
    expect(validateCNPJDigits("11222333000191")).toBe(false);
  });

  it("rejects CNPJs with wrong length", () => {
    expect(validateCNPJDigits("1234567890")).toBe(false);
    expect(validateCNPJDigits("")).toBe(false);
    expect(validateCNPJDigits("123456789012345")).toBe(false);
  });
});

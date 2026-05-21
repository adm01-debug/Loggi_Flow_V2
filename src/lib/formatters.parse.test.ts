import { describe, it, expect } from "vitest";
import { parseLocaleNumber } from "./formatters";

describe("parseLocaleNumber", () => {
  it("parses Brazilian format with thousands separator", () => {
    expect(parseLocaleNumber("1.250,00")).toBe(1250);
    expect(parseLocaleNumber("1.234.567,89")).toBe(1234567.89);
    expect(parseLocaleNumber("234,56")).toBe(234.56);
  });

  it("parses US format when both separators are present", () => {
    expect(parseLocaleNumber("1,234.56")).toBe(1234.56);
    expect(parseLocaleNumber("12,345,678.90")).toBe(12345678.9);
  });

  it("treats a lone comma as the decimal separator (BR-first)", () => {
    expect(parseLocaleNumber("1,000")).toBe(1);
    expect(parseLocaleNumber("99,90")).toBe(99.9);
  });

  it("strips currency symbols and whitespace", () => {
    expect(parseLocaleNumber("R$ 1.234,50")).toBe(1234.5);
    expect(parseLocaleNumber(" 99,90 ")).toBe(99.9);
  });

  it("handles plain integers and numbers", () => {
    expect(parseLocaleNumber("1250")).toBe(1250);
    expect(parseLocaleNumber(1250)).toBe(1250);
    expect(parseLocaleNumber(0)).toBe(0);
  });

  it("returns null for empty / invalid / nullish input", () => {
    expect(parseLocaleNumber("")).toBeNull();
    expect(parseLocaleNumber("abc")).toBeNull();
    expect(parseLocaleNumber(null)).toBeNull();
    expect(parseLocaleNumber(undefined)).toBeNull();
    expect(parseLocaleNumber(NaN)).toBeNull();
  });
});

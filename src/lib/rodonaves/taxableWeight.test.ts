import { describe, it, expect } from "vitest";
import {
  DEFAULT_CUBAGE_FACTOR,
  cubicWeightKg,
  resolveCubageFactor,
  resolveTaxableWeight,
} from "./taxableWeight";

const box = (lengthCm: number, widthCm: number, heightCm: number, quantity = 1) => ({
  lengthCm,
  widthCm,
  heightCm,
  quantity,
});

describe("resolveCubageFactor", () => {
  it("usa o fator informado pela RTE", () => {
    expect(resolveCubageFactor(250)).toBe(250);
    expect(resolveCubageFactor("180")).toBe(180);
  });

  it("cai no padrão de mercado quando o fator é inválido", () => {
    expect(resolveCubageFactor(0)).toBe(DEFAULT_CUBAGE_FACTOR);
    expect(resolveCubageFactor(undefined)).toBe(DEFAULT_CUBAGE_FACTOR);
    expect(resolveCubageFactor("abc")).toBe(DEFAULT_CUBAGE_FACTOR);
  });
});

describe("cubicWeightKg", () => {
  it("converte 1 m³ no fator", () => {
    expect(cubicWeightKg(box(100, 100, 100), 300)).toBe(300);
  });

  it("considera a quantidade de volumes", () => {
    expect(cubicWeightKg(box(100, 100, 100, 3), 300)).toBe(900);
  });

  it("devolve zero quando falta dimensão", () => {
    expect(cubicWeightKg(box(0, 100, 100), 300)).toBe(0);
    expect(cubicWeightKg(box(100, 100, 100, 0), 300)).toBe(0);
  });
});

describe("resolveTaxableWeight", () => {
  it("cobra o peso declarado quando ele é maior", () => {
    const result = resolveTaxableWeight(50, box(40, 30, 20), 300);
    expect(result.cubicKg).toBe(7.2);
    expect(result.taxableKg).toBe(50);
    expect(result.billedByCubage).toBe(false);
    expect(result.surchargePercent).toBe(0);
  });

  it("cobra a cubagem e informa o excedente", () => {
    const result = resolveTaxableWeight(100, box(120, 100, 100), 300);
    expect(result.cubicKg).toBe(360);
    expect(result.taxableKg).toBe(360);
    expect(result.billedByCubage).toBe(true);
    expect(result.surchargePercent).toBe(260);
    expect(result.volumeM3).toBe(1.2);
  });

  it("não divide por zero quando o peso declarado é vazio", () => {
    const result = resolveTaxableWeight(0, box(100, 100, 100), 300);
    expect(result.taxableKg).toBe(300);
    expect(result.surchargePercent).toBe(0);
  });
});

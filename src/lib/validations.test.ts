import { describe, expect, it } from "vitest";

import { isValidEmail } from "./validations";

/** Regex anterior, mantida so para provar equivalencia de comportamento. */
// eslint-disable-next-line sonarjs/slow-regex -- e exatamente o defeito sob teste
const REGEX_ANTIGA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

describe("isValidEmail", () => {
  it("mantem o veredito da implementacao anterior", () => {
    const casos = [
      "ti@promobrindes.com.br",
      "a@b.co",
      "sem-arroba.com",
      "dois@@arrobas.com",
      "@semlocal.com",
      "semdominio@",
      "sem@ponto",
      "ponto@no.fim.",
      "ponto@.inicio",
      "com espaco@dominio.com",
    ];

    for (const caso of casos) {
      expect(isValidEmail(caso), caso).toBe(REGEX_ANTIGA.test(caso.trim()));
    }
  });

  it("trata vazio como valido (campo opcional)", () => {
    expect(isValidEmail("")).toBe(true);
    expect(isValidEmail("   ")).toBe(true);
  });

  it("responde de imediato a entrada patologica que travava a regex", () => {
    const patologico = `${"a".repeat(50_000)}@${"b".repeat(50_000)}`;
    const inicio = performance.now();
    expect(isValidEmail(patologico)).toBe(false);
    expect(performance.now() - inicio).toBeLessThan(500);
  });
});
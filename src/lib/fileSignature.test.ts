import { describe, it, expect } from "vitest";
import { matchesMagicBytes } from "./fileSignature";

describe("matchesMagicBytes", () => {
  it("aceita PDF cujo cabecalho casa com a assinatura", () => {
    expect(matchesMagicBytes("25504446", "application/pdf")).toBe(true);
  });

  it("recusa PNG cujo cabecalho e de JPEG", () => {
    expect(matchesMagicBytes("FFD8FFE0", "image/png")).toBe(false);
  });

  it("recusa tipo fora da tabela de assinaturas", () => {
    expect(matchesMagicBytes("25504446", "text/plain")).toBe(false);
  });
});

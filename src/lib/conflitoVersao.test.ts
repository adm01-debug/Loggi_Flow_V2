import { describe, expect, it } from "vitest";
import { assertAtualizou, MENSAGEM_CONFLITO_VERSAO } from "./conflitoVersao";

describe("assertAtualizou", () => {
  it("lanca quando nenhuma linha foi afetada", () => {
    expect(() => assertAtualizou(0)).toThrow(MENSAGEM_CONFLITO_VERSAO);
    expect(() => assertAtualizou(0)).toThrow(/registro alterado por outro usu/);
  });

  it("nao lanca quando a linha foi afetada", () => {
    expect(() => assertAtualizou(1)).not.toThrow();
  });

  it("nao lanca quando o update nao pediu count", () => {
    expect(() => assertAtualizou(null)).not.toThrow();
    expect(() => assertAtualizou(undefined)).not.toThrow();
  });
});

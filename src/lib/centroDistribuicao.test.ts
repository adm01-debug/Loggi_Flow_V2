import { describe, it, expect } from "vitest";
import { resolverCentroDistribuicao, CD_PADRAO } from "./centroDistribuicao";

describe("resolverCentroDistribuicao", () => {
  it("usa o CD padrao quando o ambiente nao define nada", () => {
    expect(resolverCentroDistribuicao(undefined, undefined)).toEqual(CD_PADRAO);
  });

  it("usa as coordenadas configuradas quando sao validas", () => {
    expect(resolverCentroDistribuicao("-19.9227", "-43.9451")).toEqual({
      lat: -19.9227,
      lng: -43.9451,
    });
  });

  it("ignora configuracao pela metade", () => {
    expect(resolverCentroDistribuicao("-19.9227", undefined)).toEqual(CD_PADRAO);
    expect(resolverCentroDistribuicao(undefined, "-43.9451")).toEqual(CD_PADRAO);
  });

  it("ignora texto que nao e numero", () => {
    expect(resolverCentroDistribuicao("abc", "-43.9451")).toEqual(CD_PADRAO);
    expect(resolverCentroDistribuicao("", "")).toEqual(CD_PADRAO);
  });

  it("ignora coordenada fora da faixa geografica", () => {
    expect(resolverCentroDistribuicao("-91", "-43.9451")).toEqual(CD_PADRAO);
    expect(resolverCentroDistribuicao("-19.9227", "181")).toEqual(CD_PADRAO);
  });

  it("aceita a origem zero zero sem confundir com ausencia", () => {
    expect(resolverCentroDistribuicao("0", "0")).toEqual({ lat: 0, lng: 0 });
  });
});

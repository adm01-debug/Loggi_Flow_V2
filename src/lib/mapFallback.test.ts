import { describe, it, expect } from "vitest";
import {
  deslocamentoEstavel,
  hashEstavel,
  RAIO_DISPERSAO_GRAUS,
} from "./mapFallback";

const SP = { lat: -23.5505, lng: -46.6333 };

describe("deslocamentoEstavel", () => {
  it("devolve sempre o mesmo ponto para a mesma entrega", () => {
    // Regressao: com Math.random() o pino mudava de lugar a cada refetch.
    const a = deslocamentoEstavel(SP, "entrega-1");
    const b = deslocamentoEstavel(SP, "entrega-1");
    expect(a).toEqual(b);
  });

  it("separa entregas diferentes no mesmo estado", () => {
    const a = deslocamentoEstavel(SP, "entrega-1");
    const b = deslocamentoEstavel(SP, "entrega-2");
    expect(a.lat).not.toBe(b.lat);
    expect(a.lng).not.toBe(b.lng);
  });

  it("mantem o marcador dentro do raio de dispersao", () => {
    const limite = RAIO_DISPERSAO_GRAUS / 2;
    for (let i = 0; i < 200; i++) {
      const p = deslocamentoEstavel(SP, `entrega-${i}`);
      expect(Math.abs(p.lat - SP.lat)).toBeLessThanOrEqual(limite);
      expect(Math.abs(p.lng - SP.lng)).toBeLessThanOrEqual(limite);
    }
  });
});

describe("hashEstavel", () => {
  it("e deterministico e inteiro sem sinal de 32 bits", () => {
    const h = hashEstavel("abc");
    expect(h).toBe(hashEstavel("abc"));
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });

  it("distingue strings proximas", () => {
    expect(hashEstavel("entrega-1")).not.toBe(hashEstavel("entrega-2"));
  });

  it("trata string vazia", () => {
    expect(hashEstavel("")).toBe(0x811c9dc5);
  });
});

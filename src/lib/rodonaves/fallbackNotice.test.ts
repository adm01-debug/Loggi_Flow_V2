import { describe, expect, it } from "vitest";
import {
  extractFallbackNotice,
  fallbackNoticeMessage,
  isBlockedResponse,
} from "./fallbackNotice";

describe("extractFallbackNotice", () => {
  it("devolve null quando a rota principal respondeu", () => {
    expect(extractFallbackNotice({ success: true, data: { Tracking: [] } })).toBeNull();
  });

  it("acha o aviso dentro de data", () => {
    const payload = {
      success: true,
      data: { Url: "x", _fallback: "delivery-proof", _note: "comprovante padrao" },
    };
    expect(extractFallbackNotice(payload)).toEqual({
      route: "delivery-proof",
      note: "comprovante padrao",
      blocked: false,
    });
  });

  it("marca blocked quando nenhuma alternativa existia", () => {
    const payload = {
      success: true,
      data: { _status: 403, _fallback: "city-search", _note: "sem liberacao" },
    };
    expect(extractFallbackNotice(payload)?.blocked).toBe(true);
  });

  it("usa 'alternativa' quando a rota nao vem no payload", () => {
    expect(extractFallbackNotice({ data: { _note: "fator de mercado" } })?.route).toBe(
      "alternativa",
    );
  });

  it("ignora arrays e valores primitivos", () => {
    expect(extractFallbackNotice([{ _note: "x" }])).toBeNull();
    expect(extractFallbackNotice("texto")).toBeNull();
    expect(extractFallbackNotice(null)).toBeNull();
  });

  it("nao desce mais de 4 niveis", () => {
    const fundo = { _note: "muito fundo" };
    const payload = { data: { data: { data: { data: { data: fundo } } } } };
    expect(extractFallbackNotice(payload)).toBeNull();
  });
});

describe("isBlockedResponse", () => {
  it("reconhece o payload de bloqueio sem alternativa", () => {
    expect(
      isBlockedResponse({
        data: { _status: 403, _fallback: "local", _note: "sem liberacao" },
      }),
    ).toBe(true);
  });

  it("nao confunde rota alternativa (com dado) com bloqueio", () => {
    expect(
      isBlockedResponse({
        data: { Result: [{ ProtocolNumber: "1" }], _note: "via track-batch" },
      }),
    ).toBe(false);
  });

  it("devolve false para resposta comum", () => {
    expect(isBlockedResponse({ data: { Result: [] } })).toBe(false);
    expect(isBlockedResponse(null)).toBe(false);
  });
});

describe("fallbackNoticeMessage", () => {
  it("separa o caso bloqueado do caso alternativo", () => {
    expect(
      fallbackNoticeMessage({ route: "city-search", note: "sem liberacao", blocked: true }),
    ).toBe("Rota sem alternativa liberada (city-search): sem liberacao");
    expect(
      fallbackNoticeMessage({ route: "track-batch", note: "sem totais", blocked: false }),
    ).toBe("Rota alternativa track-batch: sem totais");
  });
});

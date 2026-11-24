import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/nexus-webhook-receiver/index.ts",
);
const src = readFileSync(EDGE, "utf8");

const ocorrencias = (alvo: string) => src.split(alvo).length - 1;

function trechoDaResposta(marcador: string): string {
  const inicio = src.indexOf(marcador);
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("return new Response", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, src.indexOf(");", fim) + 2);
}

const trechoWhatsapp = () =>
  trechoDaResposta("const normalizacao = await invokeFunction(");
const trechoGenerico = () =>
  trechoDaResposta("        const { carrier_id, text, cotacao_id } = body;");

describe("nexus-webhook-receiver: normalizacao interna com tempo limite", () => {
  it("nao usa mais functions.invoke e chama as duas vezes com 5 s", () => {
    expect(src).not.toMatch(/\.functions\.invoke\(/);
    expect(src).toContain(
      'import { invokeFunction } from "../_shared/invokeFunction.ts";',
    );
    expect(src).toMatch(/const NORMALIZE_TIMEOUT_MS = 5_000;/);
    expect(ocorrencias("await invokeFunction(")).toBe(2);
    expect(ocorrencias("timeoutMs: NORMALIZE_TIMEOUT_MS")).toBe(2);
  });

  it("responde 200 com a normalizacao nula quando o gateway nao responde", () => {
    for (const trecho of [trechoWhatsapp(), trechoGenerico()]) {
      expect(trecho).toContain("? normalizacao.data : null");
      expect(trecho).not.toMatch(/status:\s*[45]\d\d/);
    }
  });

  it("registra o motivo da falha sem lancar excecao", () => {
    expect(
      ocorrencias(
        "log.warn('Normalization unavailable; event already claimed:', { reason: normalizacao.reason })",
      ),
    ).toBe(2);
    expect(src).not.toContain("throw new Error('Normalization");
  });

  it("mantem o corpo enviado e a idempotencia antes da normalizacao", () => {
    expect(trechoWhatsapp()).toContain(
      "{ text, transportadora_id: carrier.id, cotacao_id: cotacao.id }",
    );
    expect(trechoGenerico()).toContain(
      "{ text, transportadora_id: carrier_id, cotacao_id }",
    );
    const reivindicado = src.indexOf("claimIdempotencyKey(");
    const chamada = src.indexOf("await invokeFunction(");
    expect(reivindicado).toBeGreaterThan(-1);
    expect(chamada).toBeGreaterThan(reivindicado);
  });
});

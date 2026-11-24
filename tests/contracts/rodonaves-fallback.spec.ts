import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listCapabilities } from "../../src/lib/rodonaves/capabilities";

const EDGE = join(process.cwd(), "supabase/functions/rodonaves-api/index.ts");
const src = readFileSync(EDGE, "utf8");

/** Corpo da função `async function <nome>(` até a próxima declaração. */
function corpoDaFuncao(nome: string): string {
  const marca = `async function ${nome}(`;
  const inicio = src.indexOf(marca);
  expect(inicio, `funcao ${nome} nao encontrada`).toBeGreaterThan(-1);
  const resto = src.slice(inicio + marca.length);
  const fim = resto.search(/\nasync function |\nfunction |\n\/\/ =====/);
  return fim === -1 ? resto : resto.slice(0, fim);
}

/** Função chamada pelo `case "<action>"` do handler. */
function funcaoDoCase(action: string): string {
  const marca = `case "${action}":`;
  const inicio = src.indexOf(marca);
  expect(inicio, `case ${action} nao encontrado`).toBeGreaterThan(-1);
  const fim = src.indexOf("break;", inicio);
  expect(fim, `case ${action} sem break`).toBeGreaterThan(inicio);
  const bloco = src.slice(inicio, fim);
  const chamada = bloco.match(/await (\w+)\(/);
  expect(chamada, `case ${action} nao chama funcao auxiliar`).not.toBeNull();
  return chamada![1];
}

const bloqueadas = listCapabilities().filter((c) => c.status === "bloqueado");

describe("rotas bloqueadas usam a cadeia de fallback do gateway", () => {
  it("a matriz tem rotas bloqueadas para verificar", () => {
    expect(bloqueadas.length).toBeGreaterThanOrEqual(20);
  });

  it.each(bloqueadas.map((c) => [c.action, c] as const))(
    "%s desvia o 403 em withFallback",
    (_action, capability) => {
      const corpo = corpoDaFuncao(funcaoDoCase(capability.action));
      expect(corpo).toContain("withFallback(");
    },
  );

  it.each(
    bloqueadas
      .filter((c) => c.fallback && c.fallback !== "local")
      .map((c) => [c.action, c] as const),
  )("%s declara no gateway o fallback que a matriz promete", (_action, capability) => {
    const corpo = corpoDaFuncao(funcaoDoCase(capability.action));
    expect(corpo).toContain(`"${capability.fallback}"`);
  });

  it.each(
    bloqueadas.filter((c) => !c.fallback).map((c) => [c.action, c] as const),
  )("%s sem alternativa devolve payload explicito (nao 403 cru)", (_action, capability) => {
    const corpo = corpoDaFuncao(funcaoDoCase(capability.action));
    expect(corpo).toContain('fallback: "local"');
  });
});

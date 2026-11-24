import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TrackingDateRange } from "@/hooks/logistics/useTrackingAnalytics";

const HOOK = join(process.cwd(), "src/hooks/logistics/useTrackingAnalytics.tsx");
const src = readFileSync(HOOK, "utf8");
const pagina = readFileSync(join(process.cwd(), "src/pages/Analytics.tsx"), "utf8");

/** A assinatura exportada, do nome ate o `=> {`. */
function assinatura(): string {
  const inicio = src.indexOf("export const useTrackingAnalytics");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("=> {", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

/** A cadeia do query builder: do `.from('rastreamento_historico')` ate o `;`. */
function cadeiaDoServidor(): string {
  const inicio = src.indexOf(".from('rastreamento_historico')");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf(";", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("useTrackingAnalytics: janela de datas obrigatoria (etapa 206, P-01)", () => {
  it("recebe um objeto com from e to, sem parametros opcionais", () => {
    expect(assinatura()).toContain("({ from, to }: TrackingDateRange)");
    expect(src).not.toMatch(/\bdateFrom\b/);
    expect(src).not.toMatch(/\bdateTo\b/);
  });

  it("aplica os dois filtros sem if", () => {
    const cadeia = cadeiaDoServidor();
    expect(cadeia).toContain(".gte('recorded_at', from.toISOString())");
    expect(cadeia).toContain(".lte('recorded_at', to.toISOString())");
    expect(src).not.toContain("if (dateFrom)");
    expect(src).not.toContain("if (dateTo)");
  });

  it("monta a queryKey com a janela em ISO", () => {
    expect(src).toContain(
      "queryKey: ['tracking-analytics', user?.id, from.toISOString(), to.toISOString()]",
    );
  });

  it("mantem o teto de 5000 — janela de data nao substitui teto", () => {
    const cadeia = cadeiaDoServidor();
    expect(cadeia).toContain(".limit(TRACKING_POINTS_LIMIT)");
    expect(src).toContain("const TRACKING_POINTS_LIMIT = 5000;");
  });

  it("o chamador passa a janela da tela", () => {
    expect(pagina).toContain("useTrackingAnalytics(trackingRange)");
    expect(pagina).not.toContain("useTrackingAnalytics()");
    expect(pagina).toContain("const trackingRange = {");
    expect(pagina).toContain("to: dateRange?.to || dateRange?.from || new Date(),");
  });

  it("a janela e obrigatoria no tipo, nao apenas na convencao", () => {
    const janela: TrackingDateRange = { from: new Date(0), to: new Date(0) };
    expect(janela.from.getTime()).toBe(0);
    expect(janela.to.getTime()).toBe(0);
  });

  it("o tipo rejeita a janela incompleta (prova checada por tsc --noEmit)", () => {
    // @ts-expect-error sem `to` nao compila
    const semFim: TrackingDateRange = { from: new Date(0) };
    // @ts-expect-error sem `from` nao compila
    const semInicio: TrackingDateRange = { to: new Date(0) };
    expect([semFim, semInicio]).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PAGINA = join(process.cwd(), "src/pages/Analytics.tsx");
const src = readFileSync(PAGINA, "utf8");

/**
 * O objeto de periodo que a pagina monta e entrega ao hook.
 *
 * A pagina passou a montar `trackingRange` antes da chamada (mesmo padrao do
 * `useAnalytics` logo acima), por isso o contrato e lido no objeto.
 */
function chamadaTracking(): string {
  const inicio = src.indexOf("const trackingRange = {");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("};", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("Analytics.tsx: passa o intervalo de datas da tela para useTrackingAnalytics (etapa 205, P-01)", () => {
  it("nao chama o hook sem argumentos", () => {
    expect(src).not.toContain("useTrackingAnalytics();");
  });

  it("passa o inicio do periodo selecionado", () => {
    const trecho = chamadaTracking();
    expect(trecho).toContain("dateRange?.from");
  });

  it("usa o inicio como fim quando o periodo so tem uma ponta", () => {
    // o mesmo fallback que `useAnalytics` usa logo acima, no mesmo arquivo
    expect(chamadaTracking()).toContain("dateRange?.to || dateRange?.from");
    expect(src).toContain("dateRange.to || dateRange.from!");
  });

  it("mantem a pagina como fonte do periodo, sem data fixa na chamada", () => {
    expect(src).not.toMatch(/useTrackingAnalytics\(\s*new Date\(/);
    // o periodo padrao (ultimos 30 dias) e da tela; o hook so recebe o que ela escolheu
    expect(src).toContain("from: subDays(new Date(), 30),");
  });
});

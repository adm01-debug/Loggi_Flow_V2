import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = join(process.cwd(), "src/hooks/logistics/useTrackingAnalytics.tsx");
const src = readFileSync(HOOK, "utf8");
const EXPORTACAO = readFileSync(join(process.cwd(), "src/pages/ExportacaoDados.tsx"), "utf8");
const AUDIT = readFileSync(join(process.cwd(), "src/pages/AuditTrail.tsx"), "utf8");

/** A cadeia do query builder: do `.from('rastreamento_historico')` ate o `;`. */
function criteriosDoServidor(): string {
  const inicio = src.indexOf(".from('rastreamento_historico')");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf(";", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

/** Do `if (error) throw error;` ate o `forEach` do agrupamento. */
function trechoDoAgrupamento(): string {
  const inicio = src.indexOf("if (error) throw error;");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("groupedByOrder[point.lalamove_order_id].push(point);", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("useTrackingAnalytics: teto na leitura de rastreamento_historico (etapa 204, P-01)", () => {
  it("passa um teto para o servidor na mesma cadeia do select", () => {
    const cadeia = criteriosDoServidor();
    expect(cadeia).toContain(".limit(TRACKING_POINTS_LIMIT)");
    // sem `.range()` na cadeia: o corte e um teto, nao uma pagina
    expect(cadeia).not.toContain(".range(");
  });

  it("define o teto em 5000", () => {
    expect(src).toContain("const TRACKING_POINTS_LIMIT = 5000;");
  });

  it("usa o mesmo teto ja adotado nas outras leituras analiticas grandes", () => {
    const teto = /const TRACKING_POINTS_LIMIT = (\d+);/.exec(src);
    expect(teto).not.toBeNull();
    expect(teto && teto[1]).toBe("5000");
    expect(EXPORTACAO).toContain(".limit(5000)");
    expect(AUDIT).toContain(".limit(5000)");
  });

  it("ordena do mais novo para o mais antigo antes de cortar", () => {
    const cadeia = criteriosDoServidor();
    const ordem = cadeia.indexOf(".order(");
    const corte = cadeia.indexOf(".limit(");
    expect(ordem).toBeGreaterThan(-1);
    expect(corte).toBeGreaterThan(ordem);
    expect(cadeia).toContain(".order('recorded_at', { ascending: false })");
    // com ascending: true o teto guardaria os pontos mais antigos da tabela
    expect(cadeia).not.toContain("ascending: true");
  });

  it("reinverte para ordem cronologica antes de agrupar", () => {
    const trecho = trechoDoAgrupamento();
    expect(trecho).toContain("const orderedPoints = [...(data || [])].reverse();");
    expect(trecho).toContain("orderedPoints.forEach((point) => {");
    // o array original nao pode ser consumido direto, nem mutado pelo reverse
    expect(trecho).not.toContain("(data || []).forEach");
    expect(trecho).not.toContain("(data || []).reverse()");
  });
});

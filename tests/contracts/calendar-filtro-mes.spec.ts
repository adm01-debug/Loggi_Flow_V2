import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CalendarFilters } from "@/hooks/logistics/useLogisticsCalendar";

const HOOK = join(process.cwd(), "src/hooks/logistics/useLogisticsCalendar.tsx");
const src = readFileSync(HOOK, "utf8");
const PAGINA = readFileSync(join(process.cwd(), "src/pages/CalendarioLogistico.tsx"), "utf8");

const CONSULTAS = [
  { nome: "coletas", coluna: "data_prevista_coleta" },
  { nome: "entregas", coluna: "previsao_entrega" },
] as const;

/** Um bloco de consulta do hook, do `let <nome>Query` ate o `await <nome>Query`. */
function bloco(nome: string): string {
  const inicio = src.indexOf(`let ${nome}Query = supabase`);
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf(`await ${nome}Query`, inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("useLogisticsCalendar: recorte pelo mes exibido (etapa 209, P-01)", () => {
  it("exige from e to no tipo CalendarFilters", () => {
    const completo: CalendarFilters = {
      status: [],
      transportadoraId: null,
      type: "all",
      from: new Date(0),
      to: new Date(0),
    };
    // @ts-expect-error falta 'to': sem o fim do periodo o recorte nao existe
    const semFim: CalendarFilters = {
      status: [],
      transportadoraId: null,
      type: "all",
      from: new Date(0),
    };
    // @ts-expect-error falta 'from': sem o inicio do periodo o recorte nao existe
    const semInicio: CalendarFilters = {
      status: [],
      transportadoraId: null,
      type: "all",
      to: new Date(0),
    };
    expect([completo, semFim, semInicio]).toHaveLength(3);
  });

  it("recorta o periodo no servidor nas duas consultas", () => {
    for (const { nome, coluna } of CONSULTAS) {
      const b = bloco(nome);
      expect(b).toContain(`.gte('${coluna}', from.toISOString())`);
      expect(b).toContain(`.lte('${coluna}', to.toISOString())`);
    }
  });

  it("o recorte de mes vem antes do teto, que segue como rede", () => {
    for (const { nome, coluna } of CONSULTAS) {
      const b = bloco(nome);
      expect(b.indexOf(`.gte('${coluna}'`)).toBeLessThan(b.indexOf(".limit(500)"));
      expect(b).toContain(".limit(500);");
    }
  });

  it("poe from/to na chave de cache: trocar de mes nao reaproveita o mes anterior", () => {
    expect(src).toContain("export const useLogisticsCalendar = ({ from, to, ...filters }: CalendarFilters) => {");
    const chave = src.slice(src.indexOf("queryKey: ['logistics-calendar'"));
    expect(chave.slice(0, 120)).toContain("from.toISOString()");
    expect(chave.slice(0, 120)).toContain("to.toISOString()");
  });

  it("a tela passa o mes que esta exibindo", () => {
    expect(PAGINA).toContain("from: startOfMonth(currentMonth),");
    expect(PAGINA).toContain("to: endOfMonth(currentMonth),");
    expect(PAGINA).toContain("useState(new Date())");
    expect(PAGINA).toContain("startOfMonth,\n  endOfMonth,");
  });

  it("nao abre mao dos filtros condicionais nem da ordem das etapas 207 e 208", () => {
    for (const { nome, coluna } of CONSULTAS) {
      const b = bloco(nome);
      expect(b).toContain(`.order('${coluna}', { ascending: true })`);
      expect(b).toContain("if (filters.status.length > 0)");
      expect(b).toContain("if (filters.transportadoraId)");
    }
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = readFileSync(
  join(process.cwd(), "src/hooks/analytics/useKPIBenchmark.tsx"),
  "utf8",
);

/** Sem comentarios: contar ocorrencia de codigo nao pode contar o que esta comentado. */
function semComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const LIMPO = semComentarios(HOOK);

/** O corpo do `queryFn`, do `queryFn:` ate o `staleTime`. */
function consulta(): string {
  const inicio = LIMPO.indexOf("queryFn: async () => {");
  expect(inicio).toBeGreaterThan(-1);
  const fim = LIMPO.indexOf("staleTime:", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return LIMPO.slice(inicio, fim);
}

/** O calculo por periodo, do `// Calculate metrics` ate o `return` do objeto. */
function metricas(): string {
  const q = consulta();
  const inicio = q.indexOf("const entregasData");
  expect(inicio).toBeGreaterThan(-1);
  // Ate o fim do objeto devolvido: as formulas de taxa tambem vivem nele.
  const fim = q.indexOf("};", q.indexOf("coletasNoPrazo,", inicio));
  expect(fim).toBeGreaterThan(inicio);
  return q.slice(inicio, fim + 2);
}

/** Comparacoes de texto sem depender de quebra de linha do formatador. */
function compactado(src: string): string {
  return src.replace(/\s+/g, " ");
}

describe("useKPIBenchmark: meses em paralelo (etapa 219 / P-03)", () => {
  it("nao existe mais laco com await dentro", () => {
    const q = consulta();
    expect(q).not.toContain("for (");
    // A forma antiga: um `for` contando de 0 a periodsBack.
    expect(q).not.toContain("periodsBack; i++");
  });

  it("os meses saem de um map com Promise.all", () => {
    const q = consulta();
    expect(q).toContain("await Promise.all(");
    expect(q).toContain("Array.from({ length: periodsBack })");
    expect(q).toContain(".map(async (_, i) => {");
    // Um Promise.all para os meses e outro para as tres tabelas do mes.
    expect(q.match(/Promise\.all\(/g) ?? []).toHaveLength(2);
  });

  it("as tres consultas do mes saem juntas, nao em escada", () => {
    const q = consulta();
    const interno = q.indexOf("await Promise.all([");
    const externo = q.indexOf("await Promise.all(");
    expect(interno).toBeGreaterThan(externo);
    const bloco = q.slice(interno, q.indexOf("]);", interno));
    const entregas = bloco.indexOf('.from("entregas")');
    const coletas = bloco.indexOf('.from("coletas")');
    const ocorrencias = bloco.indexOf('.from("ocorrencias")');
    expect(entregas).toBeGreaterThan(-1);
    expect(coletas).toBeGreaterThan(entregas);
    expect(ocorrencias).toBeGreaterThan(coletas);
    // Sem `await` entre elas: e isso que serializava as 18 consultas.
    expect(bloco).not.toContain("await supabase");
  });

  it("o teto de 1000 por consulta continua nas duas tabelas grandes", () => {
    const q = consulta();
    expect(q.match(/\.limit\(1000\)/g) ?? []).toHaveLength(2);
  });

  it("a ordenacao por periodo e mantida — o paralelismo nao pode trocar a ordem", () => {
    expect(consulta()).toContain(
      "periods.sort((a, b) => a.period.localeCompare(b.period));",
    );
  });

  it("o resultado do periodo volta no mesmo formato (return no lugar de push)", () => {
    const q = consulta();
    expect(q).not.toContain("periods.push(");
    expect(q).toContain("return {");
    expect(q).toContain('period: format(date, "yyyy-MM"),');
    expect(q).toContain('periodLabel: format(date, "MMM/yy"),');
  });

  it("nenhum calculo mudou: mesmos filtros de status e mesmas formulas", () => {
    const m = compactado(metricas());
    expect(m).toContain(
      'entregasData.filter( (e) => e.status === "entregue" || e.status === "finalizado"',
    );
    expect(m).toContain(
      'coletasData.filter( (c) => c.status === "finalizada" || c.status === "conferencia_ok"',
    );
    expect(m).toContain(
      "totalEntregas > 0 ? (entregasNoPrazo / totalEntregas) * 100 : 0",
    );
    expect(m).toContain(
      "totalEntregas > 0 ? custoTotal / totalEntregas : 0",
    );
    expect(m).toContain(
      "(ocorrenciasData.length / totalEntregas) * 100",
    );
    expect(m).toContain(
      "entregasComTempo > 0 ? totalDiasEntrega / entregasComTempo : 0",
    );
    expect(m).toContain("custoTotal = entregasData.reduce(");
  });

  it("a comparacao entre os dois ultimos periodos continua igual", () => {
    const q = compactado(consulta());
    expect(q).toContain("periods.length >= 2");
    expect(q).toContain("const current = periods[periods.length - 1];");
    expect(q).toContain("const previous = periods[periods.length - 2];");
  });

  it("achado registrado: a consulta de ocorrencias nao tem teto", () => {
    // Nao e escopo desta etapa (teto e a P-01); o teste fica para o dia em que o teto entrar.
    const q = consulta();
    const bloco = q.slice(q.indexOf('.from("ocorrencias")'));
    expect(bloco.slice(0, bloco.indexOf("]);"))).not.toContain(".limit(");
  });
});

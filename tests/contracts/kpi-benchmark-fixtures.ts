/**
 * Servidor de mentira e espelho do codigo anterior do `useKPIBenchmark`, usados pelos contratos das
 * etapas 219/220. Fica fora do `.spec.ts` so para respeitar o teto de linhas por arquivo.
 */
type Tabela = "entregas" | "coletas" | "ocorrencias";
type Linha = Record<string, unknown>;

import { addDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";

export interface Estado {
  tabela: Tabela;
  colunas: string;
  gte?: string;
  lte?: string;
  limit?: number;
  isNull: boolean;
}

export interface Chamada {
  tabela: Tabela;
  colunas: string;
  gte?: string;
  lte?: string;
  limit?: number;
  isNull: boolean;
}

/**
 * Servidor de mentira: filtra por intervalo como o PostgREST faz (`gte`/`lte` inclusivos), aplica o
 * `limit` de verdade e projeta apenas as colunas que o `select` pediu. Projetar importa: se o hook
 * esquecer o `created_at` no select, o agrupamento por mes quebra e o teste acusa.
 */
export const chamadas: Chamada[] = [];

const linhas: Record<Tabela, Linha[]> = {
  entregas: [],
  coletas: [],
  ocorrencias: [],
};

/** O conjunto que o servidor de mentira tem hoje: o espelho le exatamente o mesmo. */
export function linhasAtuais() {
  return linhas;
}

export function definirLinhas(tabela: Tabela, novas: Linha[]) {
  linhas[tabela] = novas;
}

export function reiniciar() {
  chamadas.length = 0;
  linhas.entregas = [];
  linhas.coletas = [];
  linhas.ocorrencias = [];
}

export function resultado(estado: Estado) {
  let filtradas = (linhas[estado.tabela] || []).filter((linha) => {
    if (typeof linha.created_at !== "string") return false;
    const t = new Date(linha.created_at).getTime();
    if (estado.gte !== undefined && t < new Date(estado.gte).getTime())
      return false;
    if (estado.lte !== undefined && t > new Date(estado.lte).getTime())
      return false;
    return true;
  });
  if (estado.isNull) {
    filtradas = filtradas.filter((linha) => linha.deleted_at == null);
  }
  if (estado.limit !== undefined) {
    filtradas = filtradas.slice(0, estado.limit);
  }
  const colunas = estado.colunas
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  return {
    data: filtradas.map((linha) =>
      Object.fromEntries(colunas.map((c) => [c, linha[c]])),
    ),
    error: null,
  };
}

export function consultaMock(tabela: Tabela) {
  const estado: Estado = { tabela, colunas: "", isNull: false };
  const api = {
    select: (colunas: string) => {
      estado.colunas = colunas;
      return api;
    },
    is: (_coluna: string, _valor: null) => {
      estado.isNull = true;
      return api;
    },
    gte: (_coluna: string, valor: string) => {
      estado.gte = valor;
      return api;
    },
    lte: (_coluna: string, valor: string) => {
      estado.lte = valor;
      return api;
    },
    limit: (n: number) => {
      estado.limit = n;
      return api;
    },
    then: (ok: (v: unknown) => unknown, err?: (e: unknown) => unknown) => {
      chamadas.push({ ...estado });
      return Promise.resolve(resultado(estado)).then(ok, err);
    },
  };
  return api;
}

/** Espelho do codigo anterior (df6b3e2e): uma consulta por mes, cada uma recortada pelo mes local. */
export function oracle(
  periodsBack: number,
  hoje: Date,
  dados: Record<Tabela, Linha[]>,
) {
  const meses = Array.from({ length: periodsBack }).map((_, i) => {
    const date = subMonths(hoje, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const noMes = (linha: Linha) => {
      const t = new Date(linha.created_at as string);
      return t >= start && t <= end;
    };
    const entregasData = (dados.entregas || []).filter(
      (l) => l.deleted_at == null && noMes(l),
    );
    const coletasData = (dados.coletas || []).filter(
      (l) => l.deleted_at == null && noMes(l),
    );
    const ocorrenciasData = (dados.ocorrencias || []).filter(noMes);

    const totalEntregas = entregasData.length;
    const entregues = entregasData.filter(
      (e) => e.status === "entregue" || e.status === "finalizado",
    );
    let entregasNoPrazo = 0;
    let totalDias = 0;
    let comTempo = 0;
    entregues.forEach((e) => {
      if (e.data_entrega_efetiva && e.previsao_entrega) {
        if (
          new Date(e.data_entrega_efetiva as string) <=
          new Date(e.previsao_entrega as string)
        ) {
          entregasNoPrazo++;
        }
      }
      if (e.data_entrega_efetiva && e.data_despacho) {
        const dias = Math.ceil(
          (new Date(e.data_entrega_efetiva as string).getTime() -
            new Date(e.data_despacho as string).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (dias > 0) {
          totalDias += dias;
          comTempo++;
        }
      }
    });
    const custoTotal = entregasData.reduce(
      (soma, e) => soma + ((e.valor_frete as number) || 0),
      0,
    );
    const totalColetas = coletasData.length;
    let coletasNoPrazo = 0;
    coletasData
      .filter((c) => c.status === "finalizada" || c.status === "conferencia_ok")
      .forEach((c) => {
        if (c.data_efetiva_coleta && c.data_prevista_coleta) {
          if (
            new Date(c.data_efetiva_coleta as string) <=
            new Date(c.data_prevista_coleta as string)
          ) {
            coletasNoPrazo++;
          }
        }
      });

    return {
      period: format(date, "yyyy-MM"),
      periodLabel: format(date, "MMM/yy"),
      totalEntregas,
      entregasNoPrazo,
      slaRate: totalEntregas > 0 ? (entregasNoPrazo / totalEntregas) * 100 : 0,
      custoTotal,
      custoMedio: totalEntregas > 0 ? custoTotal / totalEntregas : 0,
      ocorrencias: ocorrenciasData.length,
      ocorrenciaRate:
        totalEntregas > 0 ? (ocorrenciasData.length / totalEntregas) * 100 : 0,
      tempoMedioEntrega: comTempo > 0 ? totalDias / comTempo : 0,
      totalColetas,
      coletasNoPrazo,
    };
  });
  return meses.sort((a, b) => a.period.localeCompare(b.period));
}

/** Seis meses com as bordas do mes (23:30 do ultimo dia, 00:30 do primeiro) e linhas fora da janela. */
export function montarCenarioBordas(agora: Date) {
  const mes = (i: number) => subMonths(agora, i);
  const base = (i: number, dia: number, hora = 12) => {
    const d = mes(i);
    return new Date(d.getFullYear(), d.getMonth(), dia, hora, 0, 0);
  };

  definirLinhas("entregas", [
    // mes corrente: 3 entregas, 2 no prazo, frete 100/200/300
    {
      id: "e1",
      status: "entregue",
      valor_frete: 100,
      created_at: base(0, 10).toISOString(),
      data_despacho: base(0, 8).toISOString(),
      data_entrega_efetiva: base(0, 9).toISOString(),
      previsao_entrega: base(0, 9).toISOString(),
    },
    {
      id: "e2",
      status: "finalizado",
      valor_frete: 200,
      created_at: base(0, 11).toISOString(),
      data_despacho: base(0, 8).toISOString(),
      data_entrega_efetiva: base(0, 12).toISOString(),
      previsao_entrega: base(0, 10).toISOString(),
    },
    {
      id: "e3",
      status: "em_transito",
      valor_frete: 300,
      created_at: base(0, 28, 23).toISOString(),
    },
    // meses anteriores
    {
      id: "e4",
      status: "entregue",
      valor_frete: 50,
      created_at: base(1, 1, 0).toISOString(),
      data_despacho: base(1, 1).toISOString(),
      data_entrega_efetiva: base(1, 3).toISOString(),
      previsao_entrega: base(1, 5).toISOString(),
    },
    {
      id: "e5",
      status: "entregue",
      valor_frete: 70,
      created_at: base(3, 15).toISOString(),
    },
    // bordas do mes corrente: 23:30 do ultimo dia e 00:30 do primeiro dia. No fuso do Brasil o
    // primeiro cai em UTC do mes seguinte e o segundo, em UTC do mesmo mes — e o balde tem de ser
    // o mes local, como era antes (era o `startOfMonth`/`endOfMonth` que recortava).
    {
      id: "e9",
      status: "entregue",
      valor_frete: 40,
      created_at: new Date(
        agora.getFullYear(),
        agora.getMonth(),
        endOfMonth(agora).getDate(),
        23,
        30,
      ).toISOString(),
      data_despacho: base(0, 20).toISOString(),
      data_entrega_efetiva: base(0, 22).toISOString(),
      previsao_entrega: base(0, 22).toISOString(),
    },
    {
      id: "e10",
      status: "pendente",
      valor_frete: 20,
      created_at: new Date(
        agora.getFullYear(),
        agora.getMonth(),
        1,
        0,
        30,
      ).toISOString(),
    },
    // fora da janela: mes 6 atras e mes seguinte
    {
      id: "e6",
      status: "entregue",
      valor_frete: 999,
      created_at: base(6, 15).toISOString(),
    },
    {
      id: "e7",
      status: "entregue",
      valor_frete: 999,
      created_at: addDays(endOfMonth(agora), 1).toISOString(),
    },
    // deletada no mes corrente: o filtro do servidor tem de tirar
    {
      id: "e8",
      status: "entregue",
      valor_frete: 999,
      created_at: base(0, 5).toISOString(),
      deleted_at: base(0, 6).toISOString(),
    },
  ]);
  definirLinhas("coletas", [
    {
      id: "c1",
      status: "finalizada",
      created_at: base(0, 4).toISOString(),
      data_efetiva_coleta: base(0, 6).toISOString(),
      data_prevista_coleta: base(0, 6).toISOString(),
    },
    {
      id: "c2",
      status: "cancelada",
      created_at: base(0, 7).toISOString(),
    },
    {
      id: "c3",
      status: "finalizada",
      created_at: base(2, 9).toISOString(),
      data_efetiva_coleta: base(2, 11).toISOString(),
      data_prevista_coleta: base(2, 10).toISOString(),
    },
    {
      id: "c4",
      status: "finalizada",
      created_at: base(6, 3).toISOString(),
    },
  ]);
  definirLinhas("ocorrencias", [
    { id: "o1", created_at: base(0, 2).toISOString() },
    { id: "o2", created_at: base(0, 3).toISOString() },
    { id: "o3", created_at: base(1, 20).toISOString() },
    { id: "o4", created_at: base(6, 1).toISOString() },
  ]);
}

/** Quarenta linhas espalhadas por oito meses, com status, teto e deletados variados. */
export function montarCenarioGrande(agora: Date) {
  const status = ["entregue", "finalizado", "em_transito", "pendente"];
  for (let i = 0; i < 40; i++) {
    const mes = i % 8;
    const d = subMonths(agora, mes);
    const dia = (i % 27) + 1;
    const criado = new Date(d.getFullYear(), d.getMonth(), dia, i % 24, 30, 0);
    const efetiva = addDays(criado, i % 5);
    linhasAtuais().entregas.push({
      id: `e${i}`,
      status: status[i % status.length],
      valor_frete: 10 * (i % 7),
      created_at: criado.toISOString(),
      data_despacho: addDays(criado, 1).toISOString(),
      data_entrega_efetiva: efetiva.toISOString(),
      previsao_entrega: addDays(criado, 2).toISOString(),
      deleted_at: i % 13 === 0 ? criado.toISOString() : null,
    });
    linhasAtuais().coletas.push({
      id: `c${i}`,
      status: i % 3 === 0 ? "finalizada" : "em_rota",
      created_at: criado.toISOString(),
      data_efetiva_coleta: efetiva.toISOString(),
      data_prevista_coleta: addDays(criado, 1).toISOString(),
      deleted_at: i % 11 === 0 ? criado.toISOString() : null,
    });
    linhasAtuais().ocorrencias.push({
      id: `o${i}`,
      created_at: criado.toISOString(),
    });
  }
}

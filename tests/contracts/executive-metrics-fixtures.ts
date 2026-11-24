/**
 * Servidor de mentira e espelho do codigo anterior do `useExecutiveMetrics` (etapa 221). Fica fora do
 * `.spec.ts` so para respeitar o teto de linhas por arquivo.
 */
import { addDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";

type Tabela = "entregas" | "coletas" | "ocorrencias";
type Linha = Record<string, unknown>;

export interface Chamada {
  tabela: Tabela;
  colunas: string;
  gte?: string;
  lte?: string;
  limit?: number;
  isNull: boolean;
}

type Estado = Chamada;

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

/**
 * Espelho do codigo anterior (a versao de `trends` na 4f18e691): seis consultas por tabela, cada uma
 * recortada pelo mes local, com teto de 1000/1000/500 por mes.
 */
export function oracle(hoje: Date, dados: Record<Tabela, Linha[]>) {
  return Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(hoje, 5 - i);
    const start = startOfMonth(monthDate).getTime();
    const end = endOfMonth(monthDate).getTime();
    const label = format(monthDate, "MMM/yy");
    const noMes = (linha: Linha) => {
      const t = new Date(linha.created_at as string).getTime();
      return t >= start && t <= end;
    };

    const entregasList = (dados.entregas || [])
      .filter((l) => l.deleted_at == null && noMes(l))
      .slice(0, 1000);
    const coletasList = (dados.coletas || [])
      .filter((l) => l.deleted_at == null && noMes(l))
      .slice(0, 1000);
    const ocorrenciasList = (dados.ocorrencias || [])
      .filter(noMes)
      .slice(0, 500);

    const delivered = entregasList.filter(
      (e) => e.status === "entregue" || e.status === "finalizado",
    );
    const onTime = delivered.filter((e) => {
      if (!e.previsao_entrega || !e.data_entrega_efetiva) return false;
      return (
        new Date(e.data_entrega_efetiva as string) <=
        new Date(e.previsao_entrega as string)
      );
    });
    const otif =
      delivered.length > 0 ? (onTime.length / delivered.length) * 100 : 0;
    const custoFrete = entregasList.reduce(
      (acc, e) => acc + ((e.valor_frete as number) || 0),
      0,
    );

    return {
      month: label,
      entregas: entregasList.length,
      coletas: coletasList.length,
      ocorrencias: ocorrenciasList.length,
      custoFrete,
      otif: Math.round(otif * 10) / 10,
    };
  });
}

/**
 * Escala de mentira: `construir` devolve as seis datas (mes corrente primeiro) para quem precisa
 * montar linhas nas bordas.
 */
export function mes(agora: Date, i: number) {
  return subMonths(agora, i);
}

export function em(agora: Date, i: number, dia: number, hora = 12, min = 0) {
  const d = subMonths(agora, i);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    dia,
    hora,
    min,
    0,
  ).toISOString();
}

/** 23:30 do ultimo dia do mes corrente: em UTC cai no mes seguinte, em BRT e o mes local. */
export function bordaFimMes(agora: Date) {
  return em(agora, 0, endOfMonth(agora).getDate(), 23, 30);
}

/** 00:30 do primeiro dia do mes corrente: continua sendo o mes local. */
export function bordaInicioMes(agora: Date) {
  return em(agora, 0, 1, 0, 30);
}

/**
 * Cenarios de borda: todos os seis meses com linha, as duas bordas do mes corrente, uma linha
 * deletada no mes corrente, uma fora da janela em cada ponta e uma ocorrencia deletada (o codigo
 * antigo nao filtra `deleted_at` em `ocorrencias`, e isso tem de continuar igual).
 */
export function montarCenarioBordas(agora: Date) {
  definirLinhas("entregas", [
    // mes corrente: 5 linhas, 3 entregues/finalizadas, 2 no prazo, frete 100/200/300/40/20
    {
      id: "e1",
      status: "entregue",
      valor_frete: 100,
      created_at: em(agora, 0, 10),
      data_despacho: em(agora, 0, 8),
      data_entrega_efetiva: em(agora, 0, 9),
      previsao_entrega: em(agora, 0, 9),
    },
    {
      id: "e2",
      status: "finalizado",
      valor_frete: 200,
      created_at: em(agora, 0, 11),
      data_despacho: em(agora, 0, 8),
      data_entrega_efetiva: em(agora, 0, 12),
      previsao_entrega: em(agora, 0, 10),
    },
    {
      id: "e3",
      status: "em_transito",
      valor_frete: 300,
      created_at: em(agora, 0, 28),
    },
    {
      id: "e4",
      status: "entregue",
      valor_frete: 40,
      created_at: bordaFimMes(agora),
      data_despacho: em(agora, 0, 20),
      data_entrega_efetiva: em(agora, 0, 22),
      previsao_entrega: em(agora, 0, 22),
    },
    {
      id: "e5",
      status: "pendente",
      valor_frete: 20,
      created_at: bordaInicioMes(agora),
    },
    // deletada no mes corrente: o filtro `deleted_at is null` tem de tirar
    {
      id: "e6",
      status: "entregue",
      valor_frete: 999,
      created_at: em(agora, 0, 5),
      deleted_at: em(agora, 0, 6),
    },
    // fora da janela: mes seis atras e o dia seguinte ao fim do mes corrente
    {
      id: "e7",
      status: "entregue",
      valor_frete: 999,
      created_at: em(agora, 6, 15),
    },
    {
      id: "e8",
      status: "entregue",
      valor_frete: 999,
      created_at: addDays(endOfMonth(agora), 1).toISOString(),
    },
    // um por mes, para os seis baldes existirem
    ...[1, 2, 3, 4, 5].map((i) => ({
      id: `em${i}`,
      status: "entregue",
      valor_frete: 10 * i,
      created_at: em(agora, i, 6),
      data_despacho: em(agora, i, 3),
      data_entrega_efetiva: em(agora, i, 5),
      previsao_entrega: em(agora, i, 5),
    })),
  ]);

  definirLinhas("coletas", [
    {
      id: "c1",
      status: "finalizada",
      created_at: em(agora, 0, 4),
      data_efetiva_coleta: em(agora, 0, 6),
      data_prevista_coleta: em(agora, 0, 6),
    },
    { id: "c2", status: "cancelada", created_at: bordaInicioMes(agora) },
    { id: "c3", status: "finalizada", created_at: bordaFimMes(agora) },
    { id: "c4", status: "finalizada", created_at: em(agora, 2, 9) },
    { id: "c5", status: "finalizada", created_at: em(agora, 6, 3) },
    {
      id: "c6",
      status: "finalizada",
      created_at: em(agora, 0, 7),
      deleted_at: em(agora, 0, 8),
    },
  ]);

  definirLinhas("ocorrencias", [
    { id: "o1", created_at: em(agora, 0, 2) },
    { id: "o2", created_at: em(agora, 0, 3) },
    { id: "o3", created_at: bordaFimMes(agora) },
    { id: "o4", created_at: em(agora, 1, 20) },
    { id: "o5", created_at: em(agora, 6, 1) },
    {
      id: "o6",
      created_at: em(agora, 0, 4),
      deleted_at: em(agora, 0, 5),
    },
  ]);
}

/** Setenta linhas espalhadas por oito meses, com status, deletados e mes corrente variados. */
export function montarCenarioGrande(agora: Date) {
  const status = ["entregue", "finalizado", "em_transito", "pendente"];
  for (let i = 0; i < 70; i++) {
    const d = subMonths(agora, i % 8);
    const dia = (i % 27) + 1;
    const criado = new Date(d.getFullYear(), d.getMonth(), dia, i % 24, 30, 0);
    linhasAtuais().entregas.push({
      id: `ge${i}`,
      status: status[i % status.length],
      valor_frete: 10 * (i % 7),
      created_at: criado.toISOString(),
      data_despacho: addDays(criado, 1).toISOString(),
      data_entrega_efetiva: addDays(criado, i % 5).toISOString(),
      previsao_entrega: addDays(criado, 2).toISOString(),
      deleted_at: i % 13 === 0 ? criado.toISOString() : null,
    });
    linhasAtuais().coletas.push({
      id: `gc${i}`,
      status: i % 3 === 0 ? "finalizada" : "em_rota",
      created_at: criado.toISOString(),
      deleted_at: i % 11 === 0 ? criado.toISOString() : null,
    });
    linhasAtuais().ocorrencias.push({
      id: `go${i}`,
      created_at: criado.toISOString(),
    });
  }
}

/** Nove mil ocorrencias no mes corrente: mais do que qualquer teto, para ver o corte acontecer. */
export function montarCenarioTeto(agora: Date) {
  for (let i = 0; i < 9000; i++) {
    linhasAtuais().ocorrencias.push({
      id: `ot${i}`,
      created_at: em(agora, 0, (i % 27) + 1, i % 24),
    });
  }
}

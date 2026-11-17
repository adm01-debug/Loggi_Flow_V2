import { formatCurrency } from "@/lib/formatters";

const NOMES_MES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/** Quantos meses de calendario a serie historica cobre, no maximo. */
export const MESES_HISTORICO = 6;
/** Quantos meses a projecao estende alem do ultimo mes com dado real. */
export const MESES_PROJECAO = 3;
/** Minimo de meses com dado real para a projecao ser estatisticamente honesta. */
export const MINIMO_MESES_REAIS = 3;

export interface EntradaFrete {
  created_at: string;
  valor_frete: number;
}

export interface PontoFrete {
  name: string;
  real: number | null;
  pred: number | null;
}

export interface InsightFrete {
  id: string;
  title: string;
  desc: string;
  type: "warning" | "success" | "info";
}

function rotulo(ano: number, mes: number): string {
  return `${NOMES_MES[mes]}/${String(ano).slice(2)}`;
}

/**
 * Soma o frete realizado por mes de calendario, do mes mais antigo com dado
 * ate o mes de referencia, limitado a MESES_HISTORICO meses.
 *
 * Mes dentro da janela sem nenhuma entrega entra como 0 - isso e fato, nao
 * lacuna. Mes anterior a primeira entrega nao entra, para nao puxar a
 * tendencia para baixo com periodo em que o sistema nem estava em uso.
 */
export function serieHistoricaFrete(
  entradas: EntradaFrete[],
  referencia: Date = new Date(),
): { name: string; total: number }[] {
  const porMes = new Map<string, number>();
  let maisAntigo: number | null = null;

  for (const e of entradas) {
    const d = new Date(e.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const indice = d.getFullYear() * 12 + d.getMonth();
    porMes.set(
      String(indice),
      (porMes.get(String(indice)) ?? 0) + (e.valor_frete || 0),
    );
    if (maisAntigo === null || indice < maisAntigo) maisAntigo = indice;
  }

  if (maisAntigo === null) return [];

  const fim = referencia.getFullYear() * 12 + referencia.getMonth();
  const inicio = Math.max(maisAntigo, fim - (MESES_HISTORICO - 1));
  if (inicio > fim) return [];

  const serie: { name: string; total: number }[] = [];
  for (let i = inicio; i <= fim; i++) {
    serie.push({
      name: rotulo(Math.floor(i / 12), i % 12),
      total: porMes.get(String(i)) ?? 0,
    });
  }
  return serie;
}

/**
 * Regressao linear por minimos quadrados sobre a serie informada.
 * Devolve os proximos `quantidade` valores, nunca negativos.
 */
export function projetarTendencia(
  valores: number[],
  quantidade: number,
): number[] {
  if (valores.length < 2 || quantidade < 1) return [];

  const n = valores.length;
  const somaX = (n * (n - 1)) / 2;
  const somaY = valores.reduce((acc, v) => acc + v, 0);
  const somaXY = valores.reduce((acc, v, i) => acc + i * v, 0);
  const somaXX = valores.reduce((acc, _, i) => acc + i * i, 0);

  const denominador = n * somaXX - somaX * somaX;
  if (denominador === 0) return [];

  const inclinacao = (n * somaXY - somaX * somaY) / denominador;
  const intercepto = (somaY - inclinacao * somaX) / n;

  return Array.from({ length: quantidade }, (_, k) =>
    Math.max(0, intercepto + inclinacao * (n + k)),
  );
}

function proximosRotulos(ultimo: string, quantidade: number): string[] {
  const [mesTexto, anoTexto] = ultimo.split("/");
  const base = NOMES_MES.indexOf(mesTexto);
  const ano = 2000 + Number(anoTexto);
  const inicio = ano * 12 + base;
  return Array.from({ length: quantidade }, (_, k) =>
    rotulo(Math.floor((inicio + k + 1) / 12), (inicio + k + 1) % 12),
  );
}

export interface PrevisaoFrete {
  pontos: PontoFrete[];
  mesesReais: number;
  temProjecao: boolean;
  variacaoProjetada: number | null;
}

/**
 * Monta a serie do grafico: historico realizado + projecao por tendencia.
 * Com menos de MINIMO_MESES_REAIS meses de dado nao ha projecao - o grafico
 * mostra so o realizado em vez de inventar uma curva.
 */
export function montarPrevisaoFrete(
  entradas: EntradaFrete[],
  referencia: Date = new Date(),
): PrevisaoFrete {
  const historico = serieHistoricaFrete(entradas, referencia);
  const pontos: PontoFrete[] = historico.map((h) => ({
    name: h.name,
    real: h.total,
    pred: null,
  }));

  if (historico.length < MINIMO_MESES_REAIS) {
    return {
      pontos,
      mesesReais: historico.length,
      temProjecao: false,
      variacaoProjetada: null,
    };
  }

  const projetados = projetarTendencia(
    historico.map((h) => h.total),
    MESES_PROJECAO,
  );
  if (projetados.length === 0) {
    return {
      pontos,
      mesesReais: historico.length,
      temProjecao: false,
      variacaoProjetada: null,
    };
  }

  // Ancora a linha projetada no ultimo ponto real para o grafico nao quebrar.
  pontos[pontos.length - 1].pred = historico[historico.length - 1].total;
  const rotulos = proximosRotulos(
    historico[historico.length - 1].name,
    projetados.length,
  );
  projetados.forEach((v, i) => {
    pontos.push({ name: rotulos[i], real: null, pred: v });
  });

  const ultimoReal = historico[historico.length - 1].total;
  const variacao =
    ultimoReal > 0
      ? Math.round(
          ((projetados[projetados.length - 1] - ultimoReal) / ultimoReal) * 100,
        )
      : null;

  return {
    pontos,
    mesesReais: historico.length,
    temProjecao: true,
    variacaoProjetada: variacao,
  };
}

export interface FonteInsights {
  abusivos: { estado: string; percentAbove: number }[];
  consolidacao: { estado: string; cidade: string; potentialSavings: number }[];
  melhorTransportadora: Record<
    string,
    { best: string; worst: string; savings: number }
  >;
  variacaoProjetada: number | null;
}

function insightTendencia(variacao: number | null): InsightFrete | null {
  if (variacao === null || Math.abs(variacao) < 5) return null;
  const subindo = variacao > 0;
  return {
    id: "tendencia",
    title: subindo ? "Custo em alta" : "Custo em queda",
    desc: `A tendência dos últimos meses projeta ${Math.abs(variacao)}% ${
      subindo ? "acima" : "abaixo"
    } do mês atual em ${MESES_PROJECAO} meses.`,
    type: subindo ? "warning" : "success",
  };
}

function insightAbusivos(
  abusivos: FonteInsights["abusivos"],
): InsightFrete | null {
  if (abusivos.length === 0) return null;
  const pior = abusivos[0];
  return {
    id: "abusivos",
    title: `${abusivos.length} frete(s) acima da média`,
    desc: `O maior desvio está em ${pior.estado}, ${Math.round(
      pior.percentAbove,
    )}% acima da média do estado. Vale renegociar antes do próximo embarque.`,
    type: "warning",
  };
}

function insightConsolidacao(
  consolidacao: FonteInsights["consolidacao"],
): InsightFrete | null {
  if (consolidacao.length === 0) return null;
  const melhor = consolidacao[0];
  return {
    id: "consolidacao",
    title: "Consolidação disponível",
    desc: `${melhor.cidade}/${melhor.estado} tem entregas pendentes no mesmo destino: até ${formatCurrency(
      melhor.potentialSavings,
    )} de economia juntando as cargas.`,
    type: "success",
  };
}

function insightTransportadora(
  melhorTransportadora: FonteInsights["melhorTransportadora"],
): InsightFrete | null {
  const candidatos = Object.entries(melhorTransportadora).sort(
    (a, b) => b[1].savings - a[1].savings,
  );
  if (candidatos.length === 0 || candidatos[0][1].savings <= 0) return null;
  const [estado, dados] = candidatos[0];
  return {
    id: "transportadora",
    title: `Troca de transportadora em ${estado}`,
    desc: `${dados.best} sai em média ${formatCurrency(
      dados.savings,
    )} mais barata por entrega que ${dados.worst} nesse estado.`,
    type: "info",
  };
}

/**
 * Insights derivados exclusivamente dos numeros ja calculados pelo sistema.
 * Sem dado para sustentar um insight, ele simplesmente nao aparece.
 */
export function gerarInsightsFrete(fonte: FonteInsights): InsightFrete[] {
  return [
    insightTendencia(fonte.variacaoProjetada),
    insightAbusivos(fonte.abusivos),
    insightConsolidacao(fonte.consolidacao),
    insightTransportadora(fonte.melhorTransportadora),
  ].filter((i): i is InsightFrete => i !== null);
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * Paginacao no servidor (achado P-01). O `usePagination` de `./usePagination.ts` recorta um array ja
 * carregado (`data.slice`): a lista inteira foi baixada antes. Este hook busca **so a pagina exibida**.
 *
 * Contrato (fechado aqui; as etapas 203 e seguintes citam este arquivo):
 *
 * 1. A pagina vira faixa: `from = (page - 1) * pageSize`, `to = from + pageSize - 1`; quem busca chama
 *    `.range(from, to)` — **nunca** `.range()` junto com `.limit()`.
 * 2. O total vem do servidor, de `select(colunas, { count: "exact" })` -> `count`. `rows.length` e o
 *    tamanho da pagina, nao o total: usar `rows.length` em "X de Y" mostra numero errado.
 * 3. A`queryKey` inclui pagina, `pageSize` e todos os filtros (`queryKeyBase`). Trocar filtro **volta para a
 *    pagina 1**.
 * 4. A troca de pagina mantem os dados anteriores (`placeholderData`) para a tabela nao piscar; para o
 *    indicador de carregamento use `isFetching`, nao `isLoading`.
 * 5. A ordenacao e do consumidor e precisa ser **estavel** (`.order("id")` como desempate): `.range()` sem
 *    ordenacao deterministica repete e some linhas entre paginas.
 *
 * Uso:
 *
 * ```ts
 * const { rows, total, currentPage, pageSize, totalPages, setPage } = useServerPagination(
 *   ["entregas", { status }],
 *   async ({ from, to }) => {
 *     const { data, count, error } = await supabase
 *       .from("entregas")
 *       .select("id, codigo, status", { count: "exact" })
 *       .eq("status", status)
 *       .order("criado_em", { ascending: false })
 *       .order("id")
 *       .range(from, to);
 *     return { data, count, error };
 *   },
 *   { pageSize: 25 },
 * );
 * ```
 */

export interface ServerPageResult<T> {
  /** Linhas da pagina; `null` do Supabase vira lista vazia. */
  data: T[] | null;
  /** Total no servidor (`{ count: "exact" }`). `null` quando o servidor nao informa. */
  count: number | null;
  /** Erro do cliente de dados (o Supabase devolve, nao lanca) — o hook converte em estado de erro. */
  error: unknown;
}

export interface UseServerPaginationOptions {
  initialPage?: number;
  pageSize?: number;
  /** `false` nao dispara a busca (ex.: faltou filtro obrigatorio). */
  enabled?: boolean;
}

export interface UseServerPaginationReturn<T> {
  /** So a pagina atual. */
  rows: T[];
  /** Total no servidor (nao `rows.length`). */
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  /** Troca o tamanho da pagina e volta para a primeira. */
  setPageSize: (size: number) => void;
  /** Primeira carga (sem dados anteriores na tela). */
  isLoading: boolean;
  /** Busca em andamento, inclusive na troca de pagina — use para o indicador. */
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/** Com `count` do servidor, o total de paginas; sem ele, uma alem da atual enquanto ela vier cheia. */
function calcularTotalPages(count: number | null, currentPage: number, linhas: number, pageSize: number): number {
  if (count === null) return currentPage + (linhas === pageSize ? 1 : 0);
  return Math.max(1, Math.ceil(count / pageSize));
}

/** Inteiro >= 1, ou o padrao — `setPage(NaN)` nao pode virar pagina NaN. */
function inteiroPositivo(valor: number | undefined, padrao: number): number {
  if (valor === undefined || !Number.isFinite(valor)) return padrao;
  return Math.max(1, Math.trunc(valor));
}

export function useServerPagination<T>(
  queryKeyBase: readonly unknown[],
  fetchPage: (args: { from: number; to: number }) => Promise<ServerPageResult<T>>,
  options: UseServerPaginationOptions = {},
): UseServerPaginationReturn<T> {
  const { initialPage = 1, pageSize: pageSizeInicial = 10, enabled = true } = options;

  // Filtros serializados: e por eles que o hook percebe que a lista mudou e a pagina precisa voltar a 1.
  const base = JSON.stringify(queryKeyBase);

  // A pagina fica ancorada na base em que foi escolhida. Se a base atual nao for a mesma, a pagina efetiva
  // e 1 — sem efeito nem setState durante a renderizacao.
  const [ancora, setAncora] = useState(() => ({ base, page: inteiroPositivo(initialPage, 1) }));
  const [pageSize, setPageSizeState] = useState(() => inteiroPositivo(pageSizeInicial, 10));

  const currentPage = ancora.base === base ? ancora.page : 1;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const query = useQuery({
    queryKey: [...queryKeyBase, { page: currentPage, pageSize, from, to }],
    queryFn: async () => {
      const resultado = await fetchPage({ from, to });
      if (resultado.error) throw resultado.error;
      return { data: resultado.data ?? [], count: resultado.count };
    },
    enabled,
    // Mantem as linhas anteriores durante a troca de pagina (regra 4).
    placeholderData: (anterior) => anterior,
  });

  const rows = query.data?.data ?? [];
  const count = query.data?.count ?? null;
  // Sem `count`, `total` e o que ja se conhece (a faixa atual) e ha proxima pagina enquanto esta vier cheia —
  // melhor que dizer "1 de 1" e travar a navegacao numa lista que continua.
  const total = count ?? from + rows.length;
  const totalPages = calcularTotalPages(count, currentPage, rows.length, pageSize);

  const setPage = (page: number) => {
    const alvo = Math.min(inteiroPositivo(page, 1), totalPages);
    setAncora({ base, page: alvo });
  };

  return {
    rows,
    total,
    currentPage,
    pageSize,
    totalPages,
    setPage,
    nextPage: () => setPage(currentPage + 1),
    prevPage: () => setPage(currentPage - 1),
    setPageSize: (size: number) => {
      setPageSizeState(inteiroPositivo(size, 10));
      setAncora({ base, page: 1 });
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}

export default useServerPagination;

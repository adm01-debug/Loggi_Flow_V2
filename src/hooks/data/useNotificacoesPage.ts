import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerPagination } from "@/hooks/common/useServerPagination";

/** Valores de `notifications.type` (enum `notification_type` do banco). */
export const TIPOS_NOTIFICACAO = [
  "info",
  "success",
  "warning",
  "error",
  "achievement",
] as const;

export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

/** Colunas varridas pela busca textual (o que o filtro em memoria da tela cobria). */
const COLUNAS_BUSCA = ["title", "message"] as const;

export interface Notificacao {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  user_id: string;
}

export interface NotificacaoFiltros {
  /** "all" ou um valor de `TipoNotificacao`. */
  tipo: string;
  /** "all" | "read" | "unread". */
  leitura: string;
  busca: string;
}

interface Contagens {
  total: number;
  unread: number;
}

/**
 * Notificacoes do usuario com recorte, filtro, busca e contagem no servidor.
 *
 * O contrato de paginacao (faixa, total do servidor, volta para a pagina 1 quando o filtro muda)
 * esta em src/hooks/common/useServerPagination.ts. Os filtros entram na `queryKey`, entao trocar
 * tipo, status ou termo de busca reinicia a pagina — sem isso a tela pediria a pagina 3 de um
 * conjunto que agora tem uma pagina so.
 */
export function useNotificacoesPage(
  userId: string,
  { tipo, leitura, busca }: NotificacaoFiltros,
  pageSize = 15,
) {
  const fetchPage = useCallback(
    async ({ from, to }: { from: number; to: number }) => {
      if (!userId) return { data: [] as Notificacao[], count: 0, error: null };
      let query = supabase
        .from("notifications")
        .select("id, title, message, type, read, created_at, user_id", {
          count: "exact",
        })
        .eq("user_id", userId);
      if (tipo !== "all") query = query.eq("type", tipo as TipoNotificacao);
      if (leitura !== "all") query = query.eq("read", leitura === "read");
      // O termo vai entre curingas do PostgREST, entao `,` `(` `)` `%` digitados sao removidos:
      // sao sintaxe do filtro, nao conteudo da busca.
      const limpo = busca.trim().replace(/[%,()]/g, "");
      if (limpo)
        query = query.or(
          COLUNAS_BUSCA.map((coluna) => `${coluna}.ilike.%${limpo}%`).join(","),
        );
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        // Desempate por id: `created_at` repete em disparo em lote, e ordem instavel faz o
        // `.range()` repetir ou pular linha entre paginas.
        .order("id", { ascending: false })
        .range(from, to);
      return { data: (data ?? []) as Notificacao[], count, error };
    },
    [userId, tipo, leitura, busca],
  );

  // Filtros na chave: trocar filtro muda a base e o hook volta para a pagina 1.
  const pagina = useServerPagination<Notificacao>(
    ["notifications", userId, { tipo, leitura, busca: busca.trim() }],
    fetchPage,
    { pageSize, enabled: !!userId },
  );

  // A contagem da pagina nao serve para o cabecalho: "N nao lidas de X" e do conjunto inteiro.
  const { data: stats = { total: 0, unread: 0 } } = useQuery({
    queryKey: ["notifications", "stats", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Contagens> => {
      const [todas, naoLidas] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("read", false),
      ]);
      if (todas.error) throw todas.error;
      if (naoLidas.error) throw naoLidas.error;
      return { total: todas.count ?? 0, unread: naoLidas.count ?? 0 };
    },
  });

  return { ...pagina, stats };
}

export default useNotificacoesPage;

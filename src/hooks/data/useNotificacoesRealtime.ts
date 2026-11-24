import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/data/useRealtime";
import type { ServerPageResult } from "@/hooks/common/useServerPagination";
import type { Notificacao } from "@/hooks/data/useNotificacoesPage";

/** Janela em que uma rajada de avisos vira uma recarga so. */
const JANELA_RECARGA_MS = 400;

/**
 * Tempo real de `notifications` para a tela de notificacoes (etapa 216, achado P-02).
 *
 * Antes, cada aviso chamava `refetch()` da listagem: um disparo em lote de 30 notificacoes gerava 30
 * requisicoes, e as proprias mutacoes da tela (`update` de `read`) fechavam o laco — grava, o aviso chega,
 * a pagina rebaixa de novo.
 *
 * O contrato do `useRealtime` esta em src/hooks/data/useRealtime.tsx e **nao** foi alterado: 12 telas
 * dependem dele.
 *
 * - `onInsert`/`onDelete` mudam o conjunto (a linha entra ou sai): acumulam numa janela de 400 ms e disparam
 *   **uma** invalidacao ao fim dela.
 * - `onUpdate` traz a linha no payload (`{ old, new }`), entao a alteracao e aplicada no cache da pagina
 *   onde a linha esta, sem requisicao. Com filtro ou busca ativos a linha pode sair do conjunto (ex.: filtro
 *   "nao lidas" e a linha foi marcada como lida) e a recarga e a resposta certa.
 */
export function useNotificacoesRealtime({ filtroAtivo }: { filtroAtivo: boolean }) {
  const qc = useQueryClient();
  const recargaAgendada = useRef<ReturnType<typeof setTimeout> | null>(null);

  const agendarRecarga = useCallback(() => {
    if (recargaAgendada.current) clearTimeout(recargaAgendada.current);
    recargaAgendada.current = setTimeout(() => {
      recargaAgendada.current = null;
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    }, JANELA_RECARGA_MS);
  }, [qc]);

  useEffect(
    () => () => {
      if (recargaAgendada.current) clearTimeout(recargaAgendada.current);
    },
    [],
  );

  const onNotificationUpdate = useCallback(
    ({ new: linha }: { old: Notificacao; new: Notificacao }) => {
      if (filtroAtivo) {
        agendarRecarga();
        return;
      }
      qc.setQueriesData<ServerPageResult<Notificacao>>(
        { queryKey: ["notifications"] },
        (atual) =>
          atual && Array.isArray(atual.data)
            ? {
                ...atual,
                // A entrada de contagem (`["notifications", "stats", userId]`) nao tem `data`: guard acima.
                data: atual.data.map((n) =>
                  n.id === linha.id
                    ? {
                        ...n,
                        title: linha.title,
                        message: linha.message,
                        type: linha.type,
                        read: linha.read,
                      }
                    : n,
                ),
              }
            : atual,
      );
    },
    [qc, filtroAtivo, agendarRecarga],
  );

  useRealtime<Notificacao>({
    table: "notifications",
    onInsert: agendarRecarga,
    onUpdate: onNotificationUpdate,
    onDelete: agendarRecarga,
  });
}

export default useNotificacoesRealtime;

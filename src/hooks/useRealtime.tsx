import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresChangesEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions<T> {
  table: string;
  schema?: string;
  event?: PostgresChangesEvent;
  filter?: string;
  queryKey?: string[];
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: { old: T; new: T }) => void;
  onDelete?: (payload: T) => void;
  enabled?: boolean;
}

export function useRealtime<T = any>({
  table,
  schema = "public",
  event = "*",
  filter,
  queryKey,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      // Invalidar query se especificada
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }

      // Callbacks específicos
      switch (payload.eventType) {
        case "INSERT":
          onInsert?.(payload.new as T);
          break;
        case "UPDATE":
          onUpdate?.({ old: payload.old as T, new: payload.new as T });
          break;
        case "DELETE":
          onDelete?.(payload.old as T);
          break;
      }
    },
    [queryKey, queryClient, onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled) return;

    const channelConfig: any = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        channelConfig,
        handleChange as any
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, event, filter, enabled, handleChange]);

  return {
    channel: channelRef.current,
  };
}

// Hook para múltiplas tabelas
interface RealtimeTableConfig<T> extends Omit<UseRealtimeOptions<T>, "enabled"> {}

export function useMultiTableRealtime<T = any>(
  tables: RealtimeTableConfig<T>[],
  enabled = true
) {
  const queryClient = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Criar canais para cada tabela
    tables.forEach((config) => {
      const channelConfig: any = {
        event: config.event || "*",
        schema: config.schema || "public",
        table: config.table,
      };

      if (config.filter) {
        channelConfig.filter = config.filter;
      }

      const channel = supabase
        .channel(`realtime:${config.table}`)
        .on(
          "postgres_changes",
          channelConfig,
          (payload: any) => {
            if (config.queryKey) {
              queryClient.invalidateQueries({ queryKey: config.queryKey });
            }

            switch (payload.eventType) {
              case "INSERT":
                config.onInsert?.(payload.new as T);
                break;
              case "UPDATE":
                config.onUpdate?.({ old: payload.old as T, new: payload.new as T });
                break;
              case "DELETE":
                config.onDelete?.(payload.old as T);
                break;
            }
          }
        )
        .subscribe();

      channelsRef.current.push(channel);
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [tables, enabled, queryClient]);
}

export default useRealtime;

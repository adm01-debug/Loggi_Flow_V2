import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Simple internal debounce function to avoid external dependencies
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

export function useRealtime<T = Record<string, unknown>>({
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

  // Optimized invalidation with debounce to prevent rapid-fire refetches
  const debouncedInvalidate = useRef(
    debounce((keys: string[]) => {
      // Always invalidate the specific keys first
      keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
      
      // Force refresh for core dashboard components if relevant
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      // Provide haptic feedback if supported for real-time updates
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    }, 1500)
  ).current;

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
        
        // Specifically invalidate dashboard metrics if related tables change
        if (["entregas", "coletas", "ocorrencias", "ai_delay_predictions"].includes(table)) {
          debouncedInvalidate(["dashboard-metrics", "recent-alerts"]);
        }
      }

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
    [queryKey, queryClient, onInsert, onUpdate, onDelete, table]
  );

  useEffect(() => {
    if (!enabled) return;

    // Supabase Realtime API requires literal types - using type assertion for dynamic config
    const channelConfig = {
      event,
      schema,
      table,
      ...(filter && { filter }),
    } as { event: "*"; schema: "public"; table: string; filter?: string };

    const channel = supabase
      .channel(`realtime:${table}`)
      .on("postgres_changes", channelConfig, handleChange)
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

export function useMultiTableRealtime<T = Record<string, unknown>>(
  tables: RealtimeTableConfig<T>[],
  enabled = true
) {
  const queryClient = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!enabled) return;

    tables.forEach((config) => {
      const channelConfig = {
        event: config.event || "*",
        schema: config.schema || "public",
        table: config.table,
        ...(config.filter && { filter: config.filter }),
      } as { event: "*"; schema: "public"; table: string; filter?: string };

      const channel = supabase
        .channel(`realtime:${config.table}`)
        .on(
          "postgres_changes",
          channelConfig,
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
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

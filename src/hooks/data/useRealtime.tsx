/* eslint-disable sonarjs/no-nested-functions */
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

// Simple internal debounce function to avoid external dependencies
function debounce<Args extends unknown[]>(func: (...args: Args) => void, wait: number): (...args: Args) => void;
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Memory-efficient LRU cache for realtime payloads
const payloadCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

function isDuplicatePayload(table: string, payload: unknown): boolean {
  const hash = JSON.stringify(payload);
  if (payloadCache.get(table) === hash) return true;

  payloadCache.set(table, hash);
  if (payloadCache.size > MAX_CACHE_SIZE) {
    const firstKey = payloadCache.keys().next().value;
    if (firstKey) payloadCache.delete(firstKey);
  }
  return false;
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
      // Invalidate specific keys
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

      // Force refresh for core dashboard components if relevant
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Update Bitrix24 state if tracking changes
      if (keys.some((k) => ["entregas", "coletas"].includes(k))) {
        queryClient.invalidateQueries({ queryKey: ["bitrix-logs"] });
      }

      // Sync Gamification XP/Score on critical updates
      if (
        keys.some((k) => ["entregas", "coletas", "ocorrencias"].includes(k))
      ) {
        queryClient.invalidateQueries({ queryKey: ["userLevel"] });
      }

      // Provide haptic feedback if supported for real-time updates
      if ("vibrate" in navigator) {
        navigator.vibrate(5);
      }
    }, 1500),
  ).current;

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      // Avoid processing identical sequential payloads (e.g., from multiple subscriptions)
      if (isDuplicatePayload(table, payload.new || payload.old)) return;

      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });

        // Specifically invalidate dashboard metrics if related tables change
        if (
          [
            "entregas",
            "coletas",
            "ocorrencias",
            "ai_delay_predictions",
          ].includes(table)
        ) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey, queryClient, onInsert, onUpdate, onDelete, table],
  );

  useEffect(() => {
    if (!enabled) return;

    let attempt = 0;
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const channelConfig = {
        event,
        schema,
        table,
        ...(filter && { filter }),
      } as { event: "*"; schema: "public"; table: string; filter?: string };

      const channel = supabase
        .channel(`realtime:${table}:${attempt}`)
        .on("postgres_changes", channelConfig, handleChange)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            attempt = 0; // reset on healthy connection
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (cancelled) return;
            const delay = Math.min(1000 * 2 ** attempt, 30_000);
            attempt += 1;
            retryTimer = setTimeout(() => {
              if (!cancelled) {
                supabase.removeChannel(channel);
                connect();
              }
            }, delay);
          }
        });

      channelRef.current = channel;
      cleanup = () => {
        if (retryTimer) clearTimeout(retryTimer);
        supabase.removeChannel(channel);
      };
    };

    connect();

    return () => {
      cancelled = true;
      cleanup?.();
      channelRef.current = null;
    };
  }, [table, schema, event, filter, enabled, handleChange]);


  return {
    channel: channelRef.current,
  };
}

// Hook para múltiplas tabelas
type RealtimeTableConfig<T> = Omit<UseRealtimeOptions<T>, "enabled">;

export function useMultiTableRealtime<T = Record<string, unknown>>(
  tables: RealtimeTableConfig<T>[],
  enabled = true,
) {
  const queryClient = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const tablesKey = JSON.stringify(tables.map((t) => t.table));

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
          (
            payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
          ) => {
            if (config.queryKey) {
              queryClient.invalidateQueries({ queryKey: config.queryKey });
            }

            switch (payload.eventType) {
              case "INSERT":
                config.onInsert?.(payload.new as T);
                break;
              case "UPDATE":
                config.onUpdate?.({
                  old: payload.old as T,
                  new: payload.new as T,
                });
                break;
              case "DELETE":
                config.onDelete?.(payload.old as T);
                break;
            }
          },
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
    // tablesKey is the stable serialized form of the tables array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, enabled, queryClient]);
}

export default useRealtime;

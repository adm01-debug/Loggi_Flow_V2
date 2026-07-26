import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/auth/useRole";

/** Linha persistida do histórico diário de conformidade de SLO. */
export interface SLOSnapshotRow {
  id: string;
  day: string;
  gateway: string;
  checks: number;
  failures: number;
  uptime_pct: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  error_budget_used_pct: number;
  status: "ok" | "atencao" | "violado";
  uptime_target_pct: number;
  latency_p95_budget_ms: number;
}

/** Consolidação por gateway do histórico persistido. */
export interface SLOSnapshotAggregate {
  gateway: string;
  days: number;
  violatedDays: number;
  avgUptimePct: number;
  worstP95Ms: number;
  avgBudgetUsedPct: number;
}

const SNAPSHOTS_KEY = ["rte-slo-snapshots"] as const;

/** Agrega as linhas diárias por gateway (função pura, testável). */
export function aggregateSnapshots(rows: readonly SLOSnapshotRow[]): SLOSnapshotAggregate[] {
  const buckets = new Map<string, SLOSnapshotRow[]>();
  for (const row of rows) {
    const list = buckets.get(row.gateway);
    if (list) list.push(row);
    else buckets.set(row.gateway, [row]);
  }

  return [...buckets.entries()]
    .map(([gateway, list]) => ({
      gateway,
      days: list.length,
      violatedDays: list.filter((row) => row.status === "violado").length,
      avgUptimePct:
        Math.round((list.reduce((sum, row) => sum + Number(row.uptime_pct), 0) / list.length) * 10) /
        10,
      worstP95Ms: list.reduce((max, row) => Math.max(max, Number(row.p95_latency_ms)), 0),
      avgBudgetUsedPct:
        Math.round(
          (list.reduce((sum, row) => sum + Number(row.error_budget_used_pct), 0) / list.length) * 10,
        ) / 10,
    }))
    .sort((a, b) => b.avgBudgetUsedPct - a.avgBudgetUsedPct || a.gateway.localeCompare(b.gateway));
}

/**
 * Histórico persistido de conformidade de SLO (sobrevive à purga de 30 dias do
 * histórico bruto). Administradores podem forçar a consolidação do dia.
 */
export function useSLOSnapshots(days = 90) {
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();

  const snapshots = useQuery({
    queryKey: [...SNAPSHOTS_KEY, days],
    queryFn: async (): Promise<SLOSnapshotRow[]> => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("rte_slo_daily_snapshots")
        .select(
          "id, day, gateway, checks, failures, uptime_pct, avg_latency_ms, p95_latency_ms, error_budget_used_pct, status, uptime_target_pct, latency_p95_budget_ms",
        )
        .gte("day", since)
        .order("day", { ascending: false })
        .limit(2000);

      if (error) throw error;
      return (data ?? []) as SLOSnapshotRow[];
    },
    staleTime: 300_000,
    gcTime: 900_000,
  });

  const rollup = useMutation({
    mutationFn: async (targetDay?: string): Promise<number> => {
      const { data, error } = await supabase.rpc("rte_rollup_slo_daily", {
        target_day: targetDay ?? new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SNAPSHOTS_KEY });
    },
  });

  const rows = useMemo(() => snapshots.data ?? [], [snapshots.data]);
  const aggregates = useMemo(() => aggregateSnapshots(rows), [rows]);

  return {
    rows,
    aggregates,
    isLoading: snapshots.isLoading,
    error: snapshots.error as Error | null,
    refetch: snapshots.refetch,
    canRollup: isAdmin,
    rollup,
  };
}

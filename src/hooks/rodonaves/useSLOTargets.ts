import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  DEFAULT_SLO_TARGET,
  loadSLOTarget,
  normalizeTarget,
  saveSLOTarget,
  type GatewaySLOTarget,
} from "@/lib/rodonaves/gatewaySLO";

/** Chave usada para a meta global (aplicada a todos os gateways sem meta própria). */
export const GLOBAL_SLO_GATEWAY = "*";

/** Linha persistida da meta de SLO. */
export interface SLOTargetRow {
  id: string;
  gateway: string;
  uptime_target_pct: number;
  latency_p95_budget_ms: number;
  updated_at: string;
  updated_by: string | null;
}

const QUERY_KEY = ["rte-slo-targets"] as const;

/** Converte uma linha do banco no formato do motor de SLO. */
export function rowToTarget(
  row: Pick<SLOTargetRow, "uptime_target_pct" | "latency_p95_budget_ms">,
): GatewaySLOTarget {
  return normalizeTarget({
    uptimeTargetPct: Number(row.uptime_target_pct),
    latencyP95BudgetMs: Number(row.latency_p95_budget_ms),
  });
}

/**
 * Metas de SLO compartilhadas (multiusuário) com fallback local.
 *
 * Leitura: qualquer autenticado. Escrita: apenas administradores.
 * Se o banco estiver indisponível, cai para a meta salva em `localStorage`
 * para que o painel continue operando em modo degradado.
 */
export function useSLOTargets() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<SLOTargetRow[]> => {
      const { data, error } = await supabase
        .from("rte_slo_targets")
        .select(
          "id, gateway, uptime_target_pct, latency_p95_budget_ms, updated_at, updated_by",
        )
        .order("gateway", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SLOTargetRow[];
    },
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const rows = query.data ?? [];
  const globalRow = rows.find((row) => row.gateway === GLOBAL_SLO_GATEWAY);

  // Fonte da verdade: banco → localStorage → default.
  let globalTarget: GatewaySLOTarget;
  if (globalRow) {
    globalTarget = rowToTarget(globalRow);
  } else if (query.isError) {
    globalTarget = loadSLOTarget();
  } else {
    globalTarget = { ...DEFAULT_SLO_TARGET };
  }

  /** Meta efetiva de um gateway (override específico ou meta global). */
  const targetFor = (gateway: string): GatewaySLOTarget => {
    const override = rows.find((row) => row.gateway === gateway);
    return override ? rowToTarget(override) : globalTarget;
  };

  const saveTarget = useMutation({
    mutationFn: async (input: {
      gateway?: string;
      target: Partial<GatewaySLOTarget>;
    }) => {
      const gateway = input.gateway ?? GLOBAL_SLO_GATEWAY;
      const normalized = normalizeTarget(input.target);
      // Espelho local: garante continuidade caso o banco fique indisponível.
      saveSLOTarget(normalized);

      const { error } = await supabase.from("rte_slo_targets").upsert(
        {
          gateway,
          uptime_target_pct: normalized.uptimeTargetPct,
          latency_p95_budget_ms: normalized.latencyP95BudgetMs,
          updated_by: user?.id ?? null,
        },
        { onConflict: "gateway" },
      );
      if (error) throw error;
      return normalized;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    rows,
    globalTarget,
    targetFor,
    canEdit: isAdmin,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    saveTarget,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Resultado bruto de uma verificação de gateway retornado pela edge function. */
export interface GatewayCheck {
  gateway: string;
  online: boolean;
  httpStatus: number;
  latencyMs: number;
  error?: string;
}

export interface GatewayHealthResult {
  checkedAt: string;
  online: number;
  offline: number;
  total: number;
  persisted: boolean;
  gateways: GatewayCheck[];
}

/** Linha persistida do histórico de disponibilidade. */
export interface GatewayHealthRow {
  id: string;
  gateway: string;
  online: boolean;
  http_status: number;
  latency_ms: number;
  error_message: string | null;
  checked_at: string;
}

/** Agregado por gateway calculado a partir do histórico. */
export interface GatewayUptime {
  gateway: string;
  checks: number;
  uptimePct: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  lastOnline: boolean;
  lastCheckedAt: string;
}

const HISTORY_KEY = ["rte-gateway-health", "history"] as const;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

/** Agrega o histórico bruto em métricas por gateway (uptime, latência média e P95). */
export function aggregateUptime(rows: GatewayHealthRow[]): GatewayUptime[] {
  const buckets = new Map<string, GatewayHealthRow[]>();
  for (const row of rows) {
    const list = buckets.get(row.gateway);
    if (list) list.push(row);
    else buckets.set(row.gateway, [row]);
  }

  return Array.from(buckets.entries())
    .map(([gateway, list]) => {
      // O histórico chega ordenado do mais recente para o mais antigo.
      const ordered = [...list].sort(
        (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime(),
      );
      const latencies = ordered.map((r) => r.latency_ms);
      const onlineCount = ordered.filter((r) => r.online).length;
      return {
        gateway,
        checks: ordered.length,
        uptimePct: ordered.length ? (onlineCount / ordered.length) * 100 : 0,
        avgLatencyMs: latencies.length
          ? Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length)
          : 0,
        p95LatencyMs: Math.round(percentile(latencies, 95)),
        lastOnline: ordered[0]?.online ?? false,
        lastCheckedAt: ordered[0]?.checked_at ?? "",
      };
    })
    .sort((a, b) => a.uptimePct - b.uptimePct);
}

/** Gateway com queda sustentada (todas as verificações da janela offline). */
export interface GatewayDowntime {
  gateway: string;
  checks: number;
  last_checked_at: string;
  last_error: string | null;
}

/**
 * Histórico + execução manual do health-check dos gateways da Rodonaves.
 * O histórico é somente leitura no cliente; a gravação ocorre no backend.
 */
export function useGatewayHealth(hours = 24) {
  const queryClient = useQueryClient();

  const downtime = useQuery({
    queryKey: [...HISTORY_KEY, "downtime"],
    queryFn: async (): Promise<GatewayDowntime[]> => {
      const { data, error } = await supabase.rpc("rte_gateway_sustained_downtime", {
        window_hours: 2,
      });
      if (error) throw error;
      return (data ?? []) as GatewayDowntime[];
    },
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const history = useQuery({
    queryKey: [...HISTORY_KEY, hours],
    queryFn: async (): Promise<GatewayHealthRow[]> => {
      const since = new Date(Date.now() - hours * 3_600_000).toISOString();
      const { data, error } = await supabase
        .from("rte_gateway_health")
        .select("id, gateway, online, http_status, latency_ms, error_message, checked_at")
        .gte("checked_at", since)
        .order("checked_at", { ascending: false })
        .limit(2000);

      if (error) throw error;
      return (data ?? []) as GatewayHealthRow[];
    },
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const runCheck = useMutation({
    mutationFn: async (): Promise<GatewayHealthResult> => {
      const { data, error } = await supabase.functions.invoke("rodonaves-api", {
        body: { action: "health-all", persist: true },
      });
      if (error) throw error;
      const payload = data as { success?: boolean; data?: GatewayHealthResult; error?: string };
      if (!payload?.success || !payload.data) {
        throw new Error(payload?.error ?? "Falha ao verificar os gateways");
      }
      return payload.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });

  return {
    history: history.data ?? [],
    uptime: aggregateUptime(history.data ?? []),
    downtime: downtime.data ?? [],
    isLoading: history.isLoading,
    error: history.error as Error | null,
    refetch: history.refetch,
    runCheck,
  };
}

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uniqueChannelName } from "@/lib/realtimeChannel";

export interface NexusHealthChecks {
  database: boolean;
  storage: boolean;
  auth: boolean;
}

export interface NexusHealth {
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  checks: NexusHealthChecks | null;
  latency: number | null;
  measuredAt: string | null;
}

/**
 * Medição de latência real até o Supabase via subscribe no canal realtime.
 * O tempo medido reflete o round-trip efetivo da conexão atual.
 */
async function measureLatency(): Promise<number | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    // Unico por medicao: a sonda roda de tempos em tempos e duas instancias
    // com o mesmo topico falseariam a latencia medida (achado R-09).
    const channel = supabase.channel(uniqueChannelName("nexus-latency-probe"));
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      // O subscribe não confirmou em 4s — sem medição confiável.
      resolve(null);
    }, 4000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        supabase.removeChannel(channel);
        resolve(Math.max(0, Date.now() - start));
      }
    });
  });
}

/** Estado derivado dos checks reais; honra o "sem medição" como unknown. */
function deriveStatus(
  checks: NexusHealthChecks | null,
  latency: number | null,
): NexusHealth["status"] {
  if (checks === null && latency === null) return "unknown";
  if (checks !== null && Object.values(checks).every((v) => v === true)) {
    return "healthy";
  }
  if (checks !== null && Object.values(checks).some((v) => v === true)) {
    return "degraded";
  }
  return "unhealthy";
}

export function useNexusHealth(refreshMs = 30_000) {
  const [latency, setLatency] = useState<number | null>(null);
  const [checks, setChecks] = useState<NexusHealthChecks | null>(null);
  const [measuredAt, setMeasuredAt] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const refresh = useCallback(async () => {
    setIsFetching(true);
    try {
      const [ms, invoke] = await Promise.all([
        measureLatency(),
        supabase.functions
          .invoke("health-check", {})
          .then((res) => res.data as NexusHealthChecks)
          .catch(() => null),
      ]);
      if (ms !== null) {
        setLatency(Math.max(1, Math.round(ms)));
        setMeasuredAt(new Date().toISOString());
      }
      setChecks(invoke);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void refresh(), 0);
    const id = setInterval(() => void refresh(), refreshMs);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [refresh, refreshMs]);

  const status: NexusHealth["status"] = deriveStatus(checks, latency);

  return {
    status,
    checks,
    latency,
    measuredAt,
    isFetching,
    refresh,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CycleItem {
  transportadora: string | null;
  target_pct: number;
  consecutive_days_alert: number;
  breach_days: number;
  notified_in_cycle: boolean;
  status: "pending" | "notified" | "ok" | "warming";
}

export interface AccuracyMetaCycle {
  nextRunAt: Date;
  lastNotifiedAt: Date | null;
  items: CycleItem[];
}

// Cron: "15 8 * * *" UTC — próxima execução às 08:15 UTC.
function computeNextRun(now = new Date()): Date {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 15, 0, 0),
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

export function useAccuracyMetaCycle() {
  return useQuery({
    queryKey: ["accuracy-meta-cycle"],
    queryFn: async (): Promise<AccuracyMetaCycle> => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const nextRunAt = computeNextRun();

      if (!uid) return { nextRunAt, lastNotifiedAt: null, items: [] };

      const { data: settings, error } = await supabase
        .from("prediction_accuracy_settings" as never)
        .select("transportadora, target_pct, consecutive_days_alert")
        .eq("user_id", uid);
      if (error) throw error;

      const rows = (settings ?? []) as Array<{
        transportadora: string | null;
        target_pct: number;
        consecutive_days_alert: number;
      }>;

      const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Uma consulta so (P-03): antes era uma por transportadora configurada. O unico filtro que
      // varia entre elas vive dentro de `metadata`, entao ele sai do banco e vira comparacao em
      // memoria -- um `.or(...)` com um `contains` por transportadora estouraria o limite de URL do
      // PostgREST (414) justamente para quem tem muitas configuracoes.
      const { data: notificadas, error: erroNotificadas } = await supabase
        .from("notifications")
        .select("metadata")
        .eq("user_id", uid)
        .gte("created_at", dayAgoIso)
        .contains("metadata", { source: "accuracy-meta-monitor" })
        // Sem ordem, teto em conjunto sem ordem e corte nao deterministico.
        .order("created_at", { ascending: false })
        .limit(500);
      if (erroNotificadas) throw erroNotificadas;

      // A chave e a mesma dos dois lados: o `carrier` gravado pelo monitor (nulo quando ausente) e
      // `s.transportadora ?? "__all__"` procurado abaixo. Assim a comparacao continua equivalente
      // ao `.contains({ carrier })` que existia aqui.
      const carriersNotificados = new Set<string | null>(
        (notificadas ?? []).map((n) => {
          const meta = n.metadata as { carrier?: string | null } | null;
          return meta?.carrier ?? null;
        }),
      );

      // Uma chamada (P-03): a variante em lote responde todos os pares (transportadora, meta) de uma vez.
      // A funcao nasce na migration da etapa 218, aplicada depois do deploy deste codigo. Enquanto ela nao
      // existir -- ou se a resposta vier incompleta -- cai na chamada antiga, uma por transportadora, como
      // era antes.
      const chaveDoPar = (carrier: string | null, target: number) => `${carrier ?? "__all__"}|${target}`;
      const pares = rows.map((s) => ({ carrier: s.transportadora, target: Number(s.target_pct) }));

      const breachPorPar = new Map<string, number>();
      if (pares.length > 0) {
        const { data: lote, error: erroLote } = await supabase.rpc(
          "count_prediction_breach_days_bulk" as never,
          { _pairs: pares } as never,
        );
        if (!erroLote && Array.isArray(lote)) {
          for (const r of lote as Array<{
            carrier: string | null;
            target: number | string;
            breach_days: number | string;
          }>) {
            breachPorPar.set(
              chaveDoPar(r.carrier ?? null, Number(r.target)),
              Number(r.breach_days ?? 0),
            );
          }
        }
      }

      const chavesEsperadas = new Set(pares.map((p) => chaveDoPar(p.carrier, p.target)));
      const respostaCompleta =
        chavesEsperadas.size > 0 && [...chavesEsperadas].every((k) => breachPorPar.has(k));

      const breachPorLinha: number[] = respostaCompleta
        ? rows.map((s) => breachPorPar.get(chaveDoPar(s.transportadora, Number(s.target_pct))) ?? 0)
        : await Promise.all(
            rows.map(async (s) => {
              const { data: breach } = await supabase.rpc(
                "count_prediction_breach_days" as never,
                {
                  _target: s.target_pct,
                  _carrier: s.transportadora,
                } as never,
              );
              return Number(breach ?? 0);
            }),
          );

      const items: CycleItem[] = rows.map((s, indice) => {
        const breach_days = breachPorLinha[indice] ?? 0;
        const notified_in_cycle = carriersNotificados.has(s.transportadora ?? "__all__");
        let status: CycleItem["status"] = "ok";
        if (breach_days >= s.consecutive_days_alert) {
          status = notified_in_cycle ? "notified" : "pending";
        } else if (breach_days > 0) {
          status = "warming";
        }
        return {
          transportadora: s.transportadora,
          target_pct: Number(s.target_pct),
          consecutive_days_alert: s.consecutive_days_alert,
          breach_days,
          notified_in_cycle,
          status,
        };
      });

      const { data: lastNotif } = await supabase
        .from("notifications")
        .select("created_at")
        .eq("user_id", uid)
        .contains("metadata", { source: "accuracy-meta-monitor" })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        nextRunAt,
        lastNotifiedAt: lastNotif?.created_at ? new Date(lastNotif.created_at) : null,
        items,
      };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

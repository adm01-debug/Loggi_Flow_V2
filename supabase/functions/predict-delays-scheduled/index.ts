// Sprint P #3 — Cron proativo: dispara predict-delays e cria notificações para novos riscos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";
import { requireInternalSecret, requireUser } from "../_shared/auth.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";

// O cron roda a cada 30 min e ninguem esta esperando: limite folgado,
// mas finito — sem ele a execucao agendada morria sem deixar rastro.
const PREDICT_TIMEOUT_MS = 30_000;

interface PredictionItem {
  id: string;
  numero: string;
  tipo: "entrega" | "coleta";
  risco: "baixo" | "medio" | "alto" | "critico";
  probabilidade_atraso: number;
  horas_estimadas_atraso: number;
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Só o cron interno (x-internal-secret) ou Bearer service_role.
    if (!requireInternalSecret(req)) {
      const auth = await requireUser(req);
      if (!auth.ok || auth.claims.role !== "service_role") {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotência: se rodou nos últimos 2 minutos, aborta
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("delay_predictions_history")
      .select("id")
      .gte("predicted_at", twoMinAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      log("INFO", "Scheduled prediction skipped — recent run within 2min window");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "recent_run" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Snapshot da última rodada antes de invocar
    const { data: previousHigh } = await supabase
      .from("delay_predictions_history")
      .select("entity_id, risco")
      .in("risco", ["critico", "alto"])
      .gte("predicted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const prevKeys = new Set(
      (previousHigh ?? []).map((p) => `${p.entity_id}:${p.risco}`),
    );

    // Invoca a função principal
    const predResp = await invokeFunction(
      "predict-delays",
      {},
      { timeoutMs: PREDICT_TIMEOUT_MS },
    );

    if (!predResp.ok) {
      log("ERROR", "Scheduled invocation of predict-delays failed", {
        reason: predResp.reason,
        status: predResp.status,
        falhas: 1,
      });
      return new Response(
        JSON.stringify({ success: false, reason: predResp.reason }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const predictions: PredictionItem[] =
      (predResp.data as { predictions?: PredictionItem[] } | null)
        ?.predictions ?? [];
    const highRisk = predictions.filter(
      (p) => p.risco === "critico" || p.risco === "alto",
    );

    // Novos alertas = risco alto/critico que não existia na rodada anterior
    const newAlerts = highRisk.filter(
      (p) => !prevKeys.has(`${p.id}:${p.risco}`),
    );

    if (newAlerts.length === 0) {
      log("INFO", "Scheduled prediction complete — no new high-risk alerts", {
        total: predictions.length,
      });
      return new Response(
        JSON.stringify({ success: true, total: predictions.length, new_alerts: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Notifica admins de novos riscos altos/críticos
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = (admins ?? []).map((a) => a.user_id);
    const notifRows = adminIds.flatMap((uid) =>
      newAlerts.map((p) => ({
        user_id: uid,
        title: `Risco ${p.risco} de atraso detectado`,
        message: `${p.tipo === "entrega" ? "Entrega" : "Coleta"} ${p.numero} — ${p.probabilidade_atraso}% de probabilidade (+${p.horas_estimadas_atraso}h)`,
        type: p.risco === "critico" ? "error" : "warning",
        action_url: `/central-rastreamento?${p.tipo}=${p.id}`,
        metadata: { source: "predict-delays-scheduled", entity_id: p.id, entity_type: p.tipo, risco: p.risco },
      })),
    );

    if (notifRows.length > 0) {
      const { error: notifErr } = await supabase
        .from("notifications")
        .insert(notifRows);
      if (notifErr) log("ERROR", "Failed to insert notifications", notifErr);
    }

    log("INFO", "Scheduled prediction complete", {
      total: predictions.length,
      new_alerts: newAlerts.length,
      notifications_created: notifRows.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        total: predictions.length,
        new_alerts: newAlerts.length,
        notifications_created: notifRows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", "predict-delays-scheduled failure", { error: message });
    return new Response(
      JSON.stringify({ success: false, message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);

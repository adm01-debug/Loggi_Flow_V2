// Sprint P #9 — Monitor de meta de acurácia preditiva
// Roda diariamente, avalia streak de dias abaixo da meta por (usuário, transportadora)
// e cria notificação push quando o streak >= consecutive_days_alert (dedup 24h).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";

interface SettingsRow {
  user_id: string;
  transportadora: string | null;
  target_pct: number;
  consecutive_days_alert: number;
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settings, error: sErr } = await supabase
      .from("prediction_accuracy_settings")
      .select("user_id, transportadora, target_pct, consecutive_days_alert");

    if (sErr) throw sErr;

    const rows = (settings ?? []) as SettingsRow[];
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, evaluated: 0, notifications_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let created = 0;

    for (const s of rows) {
      const { data: breach, error: bErr } = await supabase.rpc(
        "count_prediction_breach_days",
        { _target: s.target_pct, _carrier: s.transportadora },
      );
      if (bErr) {
        log("ERROR", "breach RPC failed", { user: s.user_id, err: bErr.message });
        continue;
      }
      const days = Number(breach ?? 0);
      if (days < s.consecutive_days_alert) continue;

      // Dedup: já notificamos esse usuário/carrier nas últimas 24h?
      const carrierTag = s.transportadora ?? "__all__";
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", s.user_id)
        .gte("created_at", dayAgo)
        .contains("metadata", {
          source: "accuracy-meta-monitor",
          carrier: carrierTag,
        })
        .limit(1);

      if (existing && existing.length > 0) continue;

      const carrierLabel = s.transportadora ?? "todas as transportadoras";
      const { error: nErr } = await supabase.from("notifications").insert({
        user_id: s.user_id,
        title: `Meta de acurácia preditiva violada (${carrierLabel})`,
        message: `Acurácia ficou abaixo de ${s.target_pct}% por ${days} dia(s) consecutivo(s).`,
        type: "warning",
        action_url: "/painel-sla",
        metadata: {
          source: "accuracy-meta-monitor",
          carrier: carrierTag,
          target_pct: s.target_pct,
          breach_days: days,
        },
      });
      if (nErr) {
        log("ERROR", "notification insert failed", { user: s.user_id, err: nErr.message });
        continue;
      }
      created++;
    }

    log("INFO", "accuracy-meta-monitor complete", {
      evaluated: rows.length,
      notifications_created: created,
    });

    return new Response(
      JSON.stringify({
        success: true,
        evaluated: rows.length,
        notifications_created: created,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", "accuracy-meta-monitor failure", { error: message });
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);

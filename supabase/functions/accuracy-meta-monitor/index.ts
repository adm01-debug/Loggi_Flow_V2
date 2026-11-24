// Sprint P #9 — Monitor de meta de acurácia preditiva
// Roda diariamente, avalia streak de dias abaixo da meta por (usuário, transportadora)
// e cria notificação push quando o streak >= consecutive_days_alert (dedup 24h).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";
import { decideEscalation, DEFAULT_ESCALATION, HistoricalNotification } from "./escalation.ts";

// Etapa 162 (achado B-05): as duas chamadas externas do monitor passam pelo
// helper com tempo limite — sem ele um provedor lento segurava o cron inteiro.
const DISPATCH_TIMEOUT_MS = 10_000;

interface SettingsRow {
  user_id: string;
  transportadora: string | null;
  target_pct: number;
  consecutive_days_alert: number;
  notify_email: boolean | null;
  notify_whatsapp: boolean | null;
  email: string | null;
  whatsapp_phone: string | null;
}

function resolveChannels(s: SettingsRow) {
  const emailRaw = (s.email ?? "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
  const phoneDigits = (s.whatsapp_phone ?? "").replace(/\D/g, "");
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  return {
    email: s.notify_email && emailOk ? emailRaw : null,
    whatsapp: s.notify_whatsapp && phoneOk ? phoneDigits : null,
  };
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
      .select("user_id, transportadora, target_pct, consecutive_days_alert, notify_email, notify_whatsapp, email, whatsapp_phone");

    if (sErr) throw sErr;

    const rows = (settings ?? []) as SettingsRow[];
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, evaluated: 0, notifications_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const WINDOW_MS = 24 * 60 * 60 * 1000;
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Agrupa por (user_id, carrier) para evitar reprocessamento duplicado quando
    // o mesmo par aparece mais de uma vez em prediction_accuracy_settings.
    const seen = new Set<string>();

    for (const s of rows) {
      const carrierTag = s.transportadora ?? "__all__";
      const groupKey = `${s.user_id}::${carrierTag}`;
      if (seen.has(groupKey)) {
        skipped++;
        continue;
      }
      seen.add(groupKey);

      const { data: breach, error: bErr } = await supabase.rpc(
        "count_prediction_breach_days",
        { _target: s.target_pct, _carrier: s.transportadora },
      );
      if (bErr) {
        log.error("breach RPC failed", { user: s.user_id, err: bErr.message });
        continue;
      }
      const days = Number(breach ?? 0);
      if (days < s.consecutive_days_alert) continue;

      // Dedup janela 24h por (user, carrier). Busca todas as variações de
      // carrier já persistidas (null literal ou "__all__") para o caso "todas".
      const carrierVariants =
        s.transportadora === null ? ["__all__", null] : [carrierTag];

      const { data: existingList } = await supabase
        .from("notifications")
        .select("id, created_at, metadata")
        .eq("user_id", s.user_id)
        .gte("created_at", windowStart)
        .contains("metadata", { source: "accuracy-meta-monitor" })
        .order("created_at", { ascending: false });

      type ExistingMeta = {
        source?: string;
        carrier?: string | null;
        breach_days?: number;
        target_pct?: number;
      };
      const matchingInWindow = (existingList ?? []).filter((n) => {
        const meta = (n.metadata ?? {}) as ExistingMeta;
        return carrierVariants.includes(meta.carrier ?? null);
      });

      const signatureHit = matchingInWindow.find((n) => {
        const meta = (n.metadata ?? {}) as ExistingMeta;
        return meta.breach_days === days && meta.target_pct === s.target_pct;
      });

      if (signatureHit) {
        skipped++;
        continue;
      }

      const carrierLabel = s.transportadora ?? "todas as transportadoras";
      const payload = {
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
          window_hours: 24,
          last_evaluated_at: new Date().toISOString(),
        },
      };

      // Se já existe alerta no mesmo grupo (24h) mas com breach_days diferente,
      // atualiza o registro em vez de criar duplicata.
      if (matchingInWindow.length > 0) {
        const target = matchingInWindow[0];
        const { error: uErr } = await supabase
          .from("notifications")
          .update({
            title: payload.title,
            message: payload.message,
            metadata: payload.metadata,
            read: false,
            read_at: null,
          })
          .eq("id", target.id);
        if (uErr) {
          log.error("notification update failed", { user: s.user_id, err: uErr.message });
          continue;
        }
        updated++;
        continue;
      }

      const { error: nErr } = await supabase.from("notifications").insert(payload);
      if (nErr) {
        log.error("notification insert failed", { user: s.user_id, err: nErr.message });
        continue;
      }
      created++;

      // ─── Sprint P #10 + #13: dispatch canais externos + escalonamento WhatsApp ───
      const channels = resolveChannels(s);

      // Sprint P #13: escalonamento — busca 72h de histórico para decidir escalar WA
      const escalationWindowStart = new Date(
        Date.now() - DEFAULT_ESCALATION.windowHours * 60 * 60 * 1000,
      ).toISOString();
      const { data: escalationHistory } = await supabase
        .from("notifications")
        .select("id, created_at, read, metadata")
        .eq("user_id", s.user_id)
        .gte("created_at", escalationWindowStart)
        .contains("metadata", { source: "accuracy-meta-monitor" });

      const decision = decideEscalation(
        (escalationHistory ?? []) as HistoricalNotification[],
        carrierTag,
        new Date(),
      );

      const phoneDigits = (s.whatsapp_phone ?? "").replace(/\D/g, "");
      const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 15;
      const shouldEscalateWhatsapp =
        decision.escalate && phoneOk && !channels.whatsapp;

      const dispatched: Record<string, string> = {};

      if (channels.email) {
        const envioEmail = await invokeFunction(
          "resend-email",
          {
            to: channels.email,
            subject: payload.title,
            html: `<p>${payload.message}</p><p><a href="${Deno.env.get("APP_URL") ?? ""}/painel-sla">Abrir Painel SLA</a></p>`,
          },
          { timeoutMs: DISPATCH_TIMEOUT_MS },
        );
        dispatched.email = envioEmail.ok ? "ok" : `error:${envioEmail.reason}`;
      }

      const whatsappTarget = channels.whatsapp ?? (shouldEscalateWhatsapp ? phoneDigits : null);
      if (whatsappTarget) {
        const escalationSuffix = shouldEscalateWhatsapp
          ? ` [ESCALONADO: ${decision.ignoredCount} email(s) não lido(s) em ${DEFAULT_ESCALATION.windowHours}h]`
          : "";
        const envioWhatsapp = await invokeFunction(
          "whatsapp-notification",
          {
            action: "send_custom",
            phone: whatsappTarget,
            template: "accuracy_meta_alert",
            variables: {
              title: payload.title + escalationSuffix,
              message: payload.message,
              carrier: carrierLabel,
              target: String(s.target_pct),
              days: String(days),
            },
          },
          { timeoutMs: DISPATCH_TIMEOUT_MS },
        );
        dispatched.whatsapp = !envioWhatsapp.ok
          ? `error:${envioWhatsapp.reason}`
          : shouldEscalateWhatsapp
            ? "ok:escalated"
            : "ok";
      }

      if (Object.keys(dispatched).length > 0 || shouldEscalateWhatsapp) {
        await supabase
          .from("notifications")
          .update({
            metadata: {
              ...payload.metadata,
              channels: dispatched,
              escalation: {
                escalated: shouldEscalateWhatsapp,
                ignored_count: decision.ignoredCount,
                reason: decision.reason,
                window_hours: DEFAULT_ESCALATION.windowHours,
              },
            },
          })
          .eq("user_id", s.user_id)
          .eq("title", payload.title)
          .gte("created_at", new Date(Date.now() - 60_000).toISOString());
        log.info("external channels dispatched", {
          user: s.user_id,
          dispatched,
          escalated: shouldEscalateWhatsapp,
          ignored: decision.ignoredCount,
        });
      }
    }

    log.info("accuracy-meta-monitor complete", {
      evaluated: rows.length,
      groups: seen.size,
      notifications_created: created,
      notifications_updated: updated,
      skipped,
    });

    return new Response(
      JSON.stringify({
        success: true,
        evaluated: rows.length,
        groups: seen.size,
        notifications_created: created,
        notifications_updated: updated,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("accuracy-meta-monitor failure", { error: message });
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);

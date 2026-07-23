// Edge Function: digest semanal de metas de acurácia.
// Para cada usuário com notify_email + email configurado, agrega as
// notificações da última semana e envia um único email consolidado via
// resend-email, evitando spam de alertas diários.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildDigest, DigestNotification, renderDigestEmail } from "./digest.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  user_id: string;
  email: string;
}

interface DispatchResult {
  user_id: string;
  status: "sent" | "empty" | "error";
  detail?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1) Destinatários únicos (settings com notify_email + email)
    const { data: settings, error: sErr } = await supabase
      .from("prediction_accuracy_settings")
      .select("user_id, email, notify_email")
      .eq("notify_email", true)
      .not("email", "is", null);

    if (sErr) throw sErr;

    const recipients = new Map<string, Recipient>();
    for (const s of settings ?? []) {
      const email = (s.email ?? "").trim();
      if (!email) continue;
      if (!recipients.has(s.user_id)) recipients.set(s.user_id, { user_id: s.user_id, email });
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const results: DispatchResult[] = [];

    for (const r of recipients.values()) {
      const { data: notifs, error: nErr } = await supabase
        .from("notifications")
        .select("id, created_at, metadata")
        .eq("user_id", r.user_id)
        .contains("metadata", { source: "accuracy-meta-monitor" })
        .gte("created_at", windowStart)
        .order("created_at", { ascending: false })
        .limit(500);

      if (nErr) {
        results.push({ user_id: r.user_id, status: "error", detail: nErr.message });
        continue;
      }

      const digestInput = (notifs ?? []) as DigestNotification[];
      const report = buildDigest(digestInput, now);
      const email = renderDigestEmail(report);
      if (!email) {
        results.push({ user_id: r.user_id, status: "empty" });
        continue;
      }

      try {
        const { error: eErr } = await supabase.functions.invoke("resend-email", {
          body: { to: r.email, subject: email.subject, html: email.html },
        });
        if (eErr) {
          results.push({ user_id: r.user_id, status: "error", detail: eErr.message });
        } else {
          results.push({ user_id: r.user_id, status: "sent" });
          // Registra na tabela de notificações para auditoria/histórico
          await supabase.from("notifications").insert({
            user_id: r.user_id,
            title: email.subject,
            message: `Digest semanal com ${report.totalAlerts} alerta(s) enviado para ${r.email}`,
            type: "info",
            metadata: {
              source: "accuracy-weekly-digest",
              alerts: report.totalAlerts,
              carriers: report.carriers.length,
              window_start: report.windowStart,
              window_end: report.windowEnd,
            },
          });
        }
      } catch (e) {
        results.push({
          user_id: r.user_id,
          status: "error",
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        recipients: recipients.size,
        sent: results.filter((r) => r.status === "sent").length,
        empty: results.filter((r) => r.status === "empty").length,
        errors: results.filter((r) => r.status === "error").length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("accuracy-weekly-digest failed", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

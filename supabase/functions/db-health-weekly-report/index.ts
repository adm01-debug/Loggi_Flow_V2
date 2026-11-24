import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { safeFetch } from "../_shared/safeFetch.ts";
import { log } from "../_shared/logger.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";

// Sprint 43 — Envia um relatório semanal (HTML) de saúde do banco para todos os admins.
// Consolida: SLO diário (últimos 7d), anomalias, sugestões de remediação e forecast.
// Disparado por pg_cron semanal (segunda 08:00 UTC).

interface SloRow {
  day: string;
  samples: number;
  connection_slo_pct: number;
  cache_slo_pct: number;
  deadlock_free_pct: number;
  overall_slo_pct: number;
}

interface AnomalyRow {
  metric: string;
  current_value: number;
  mean_value: number;
  z_score: number;
  severity: string;
}

interface SuggestionRow {
  id: string;
  category: string;
  severity: string;
  title: string;
  detail: string;
  recommended_action: string;
}

interface ForecastRow {
  metric: string;
  current_value: number;
  forecast_value: number;
  threshold: number;
  hours_until_threshold: number | null;
  severity: string;
}

const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

const sevColor = (sev: string): string =>
  sev === "critical" ? "#dc2626" : sev === "warning" ? "#d97706" : "#16a34a";

const buildHtml = (params: {
  slo: SloRow[];
  anomalies: AnomalyRow[];
  suggestions: SuggestionRow[];
  forecast: ForecastRow[];
}): string => {
  const { slo, anomalies, suggestions, forecast } = params;
  const overall7d =
    slo.length > 0
      ? (
          slo.reduce((s, r) => s + Number(r.overall_slo_pct ?? 0), 0) /
          slo.length
        ).toFixed(2)
      : "N/A";

  const sloRows = slo
    .map(
      (r) =>
        `<tr><td>${r.day}</td><td>${r.samples}</td><td>${r.connection_slo_pct}%</td><td>${r.cache_slo_pct}%</td><td>${r.deadlock_free_pct}%</td><td><b>${r.overall_slo_pct}%</b></td></tr>`,
    )
    .join("");

  const anomaliesHtml =
    anomalies.length === 0
      ? '<p style="color:#16a34a;">✅ Nenhuma anomalia detectada.</p>'
      : anomalies
          .map(
            (a) =>
              `<li><b>${escapeHtml(a.metric)}</b> — z=${a.z_score} · atual ${a.current_value} · média ${a.mean_value} <span style="color:${sevColor(a.severity)};font-weight:bold;">[${a.severity}]</span></li>`,
          )
          .join("");

  const suggestionsHtml =
    suggestions.length === 0
      ? '<p style="color:#16a34a;">✅ Nenhuma ação recomendada.</p>'
      : suggestions
          .map(
            (s) =>
              `<div style="border-left:4px solid ${sevColor(s.severity)};padding:8px 12px;margin:8px 0;background:#f9fafb;"><b>${escapeHtml(s.title)}</b><br/><small style="color:#6b7280;">${escapeHtml(s.detail)}</small><br/><i>👉 ${escapeHtml(s.recommended_action)}</i></div>`,
          )
          .join("");

  const forecastHtml =
    forecast.length === 0
      ? "<p>Sem dados suficientes para forecast.</p>"
      : forecast
          .map(
            (f) =>
              `<li><b>${escapeHtml(f.metric)}</b>: atual ${f.current_value} → previsto ${f.forecast_value} (limite ${f.threshold}${f.hours_until_threshold != null ? `, ETA ${f.hours_until_threshold}h` : ""}) <span style="color:${sevColor(f.severity)};font-weight:bold;">[${f.severity}]</span></li>`,
          )
          .join("");

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:720px;margin:auto;color:#111827;">
    <h1 style="border-bottom:2px solid #e5e7eb;padding-bottom:8px;">📊 LogiFlow — Relatório Semanal de Saúde do Banco</h1>
    <p style="color:#6b7280;">Gerado em ${new Date().toISOString()}</p>
    <h2>SLO Médio (7d): <span style="color:${Number(overall7d) >= 99 ? "#16a34a" : Number(overall7d) >= 95 ? "#d97706" : "#dc2626"};">${overall7d}%</span></h2>

    <h3>SLO Diário</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;" border="1" cellpadding="6">
      <thead style="background:#f3f4f6;"><tr><th>Dia</th><th>Amostras</th><th>Conexões</th><th>Cache</th><th>Sem Deadlock</th><th>Geral</th></tr></thead>
      <tbody>${sloRows || '<tr><td colspan="6">Sem dados</td></tr>'}</tbody>
    </table>

    <h3>🔍 Anomalias (z-score 7d)</h3>
    <ul>${anomaliesHtml}</ul>

    <h3>🔮 Forecast de Capacidade (7d à frente)</h3>
    <ul>${forecastHtml}</ul>

    <h3>💡 Sugestões de Remediação</h3>
    ${suggestionsHtml}

    <hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;"/>
    <p style="font-size:12px;color:#9ca3af;">Este relatório é gerado automaticamente toda segunda-feira. Acesse <b>/admin/db-health</b> para o painel ao vivo.</p>
  </body></html>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    // Coleta métricas
    const since7d = new Date(Date.now() - 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const [sloRes, anomaliesRes, suggestionsRes, forecastRes] =
      await Promise.all([
        admin
          .from("db_slo_daily")
          .select(
            "day,samples,connection_slo_pct,cache_slo_pct,deadlock_free_pct,overall_slo_pct",
          )
          .gte("day", since7d)
          .order("day", { ascending: true }),
        admin.rpc("get_health_anomalies_fast"),
        admin.rpc("get_remediation_suggestions_fast"),
        admin.rpc("get_capacity_forecast_fast", { p_hours_ahead: 168 }),
      ]);

    const html = buildHtml({
      slo: (sloRes.data as SloRow[] | null) ?? [],
      anomalies: ((anomaliesRes.data as AnomalyRow[] | null) ?? []).filter(
        (a) => a.severity !== "ok",
      ),
      suggestions: (suggestionsRes.data as SuggestionRow[] | null) ?? [],
      forecast: (forecastRes.data as ForecastRow[] | null) ?? [],
    });

    // Descobre emails dos admins
    const { data: adminRoles, error: rolesErr } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (rolesErr) throw rolesErr;

    const adminIds = (adminRoles ?? []).map(
      (r: { user_id: string }) => r.user_id,
    );
    if (adminIds.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, reason: "no admins" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: profiles } = await admin
      .from("profiles")
      .select("email")
      .in("id", adminIds);
    const emails = ((profiles ?? []) as { email: string | null }[])
      .map((p) => p.email)
      .filter((e): e is string => !!e && e.includes("@"));

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, reason: "no admin emails" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const subject = `📊 Saúde do Banco — Relatório Semanal (${new Date().toISOString().slice(0, 10)})`;

    const response = await safeFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "LogiFlow <notificacoes@promobrindes.com.br>",
        to: emails,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      // A resposta do Resend carrega destinatarios e dominio: fica no log, nao no corpo.
      log.error("[db-health-weekly-report] Provedor recusou o envio:", {
        status: response.status,
        body: (await response.text()).slice(0, 500),
      });
      throw new Error("Falha ao enviar o relatorio pelo provedor");
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ ok: true, sent: emails.length, resend_id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return internalErrorResponse(err, corsHeaders, "db-health-weekly-report");
  }
});

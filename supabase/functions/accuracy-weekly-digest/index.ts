// Edge Function: digest semanal de metas de acurácia.
// Modos:
//   - Padrão (POST sem body ou body.preview !== true): itera destinatários,
//     agrega semana e envia via resend-email + audita.
//   - Preview (body.preview === true): usa o Bearer do usuário chamador,
//     retorna { subject, html, report } SEM enviar email nem gravar auditoria.
//     Usado pelo PainelSLA para permitir revisão antes do disparo real.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { log } from "../_shared/logger.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  buildDigest,
  DigestNotification,
  renderDigestEmail,
} from "./digest.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Etapa 163 (achado B-05): o envio do digest passa pelo helper com tempo
// limite — sem ele um resend-email lento prendia a funcao por destinatario.
const DIGEST_EMAIL_TIMEOUT_MS = 10_000;

interface Recipient {
  user_id: string;
  email: string;
}

interface DispatchResult {
  user_id: string;
  status: "sent" | "empty" | "error";
  detail?: string;
}

async function handlePreview(req: Request): Promise<Response> {
  const headers = getCorsHeaders(req);
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing Authorization header" }),
      {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: userRes, error: uErr } = await service.auth.getUser(token);
  if (uErr || !userRes?.user) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid session" }),
      {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }

  const now = new Date();
  const windowStart = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: notifs, error: nErr } = await service
    .from("notifications")
    .select("id, created_at, metadata")
    .eq("user_id", userRes.user.id)
    .contains("metadata", { source: "accuracy-meta-monitor" })
    .gte("created_at", windowStart)
    .order("created_at", { ascending: false })
    .limit(500);

  if (nErr) {
    log.error("accuracy-weekly-digest: falha ao ler notificacoes", {
      code: nErr.code,
      message: nErr.message,
    });
    return new Response(
      JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }

  const report = buildDigest((notifs ?? []) as DigestNotification[], now);
  const email = renderDigestEmail(report);
  return new Response(
    JSON.stringify({
      ok: true,
      preview: true,
      empty: !email,
      subject: email?.subject ?? null,
      html: email?.html ?? null,
      report,
    }),
    {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    },
  );
}

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS")
    return new Response(null, { headers });

  // Modo preview — não envia email, retorna HTML pro usuário chamador.
  if (req.method === "POST") {
    try {
      const cloned = req.clone();
      const body = await cloned.json().catch(() => null);
      if (
        body &&
        typeof body === "object" &&
        (body as { preview?: unknown }).preview === true
      ) {
        return await handlePreview(req);
      }
    } catch {
      /* ignora e cai no fluxo padrão */
    }
  }

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
      if (!recipients.has(s.user_id))
        recipients.set(s.user_id, { user_id: s.user_id, email });
    }

    const now = new Date();
    const windowStart = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
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
        results.push({
          user_id: r.user_id,
          status: "error",
          detail: nErr.message,
        });
        continue;
      }

      const digestInput = (notifs ?? []) as DigestNotification[];
      const report = buildDigest(digestInput, now);
      const email = renderDigestEmail(report);
      if (!email) {
        results.push({ user_id: r.user_id, status: "empty" });
        continue;
      }

      const envio = await invokeFunction(
        "resend-email",
        { to: r.email, subject: email.subject, html: email.html },
        { timeoutMs: DIGEST_EMAIL_TIMEOUT_MS },
      );
      if (!envio.ok) {
        results.push({
          user_id: r.user_id,
          status: "error",
          detail: envio.reason,
        });
      } else {
        results.push({ user_id: r.user_id, status: "sent" });
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
      {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    log.error("accuracy-weekly-digest failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response(
      JSON.stringify({
        ok: false,
        error: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }
});

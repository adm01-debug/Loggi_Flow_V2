// push-send: envia notificação web-push (VAPID) para as inscrições de um usuário
// (ou de todos os usuários quando topic == "all").
// Requer segredos VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY no runtime.
// Limita a lote por minuto via rate limiter; falha por inscrição não derruba o lote.
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as webpush from "https://esm.sh/web-push@3.6.7?target=deno";
import { log } from "../_shared/logger.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const MAX_BATCH = 100;

// B-09 (etapa 200): o `web-push` fala com FCM/APNs por conta propria e nao passa
// por `safeFetch`, entao nao tinha tempo limite nenhum - provedor lento prendia o
// laco e o lote inteiro morria no limite de execucao da funcao. `options.timeout`
// existe na biblioteca (web-push@3.6.7, `web-push-lib.js:222`) e destroi o socket;
// mesmo valor de `_shared/fetch-with-timeout.ts:9`. O estouro e falha DA INSCRICAO
// (o `catch` do laco ja segue com as outras) e NAO se retenta: cada reenvio seria
// uma notificacao repetida no celular do usuario (B-10).
const PUSH_TIMEOUT_MS = 10000;

function isPushTimeout(e: unknown): boolean {
  const err = e as { statusCode?: number; code?: string; message?: string };
  if (err?.statusCode) return false;
  return err?.code === "ETIMEDOUT" || /timeout/i.test(err?.message ?? "");
}

// Validação se as credenciais VAPID existem sem quebrar import em ambiente sem secret.
function getVapid() {
  const subject = Deno.env.get("VAPID_SUBJECT");
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!subject || !publicKey || !privateKey) {
    return null;
  }
  return { subject, publicKey, privateKey };
}

function bearerToken(req: Request): string {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice("Bearer ".length) : "";
}

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  try {
    const rl = await checkRateLimit(req, "push-send", {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const token = bearerToken(req);

    // Autenticação: service role (interna) ou usuário autenticado enviando para si.
    // Service role lê qualquer usuário; usuário autenticado só a si mesmo.
    const isService = token !== "" && token === serviceKey;
    let targetUserId: string | null | undefined;

    const body = await req.json().catch(() => null);

    if (!isService) {
      const admin = createClient(supabaseUrl, token);
      const {
        data: { user },
        error: authErr,
      } = await admin.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
      targetUserId = user.id;
    } else {
      targetUserId = body?.userId ?? null;
    }

    if (
      !body ||
      typeof body?.title !== "string" ||
      typeof body?.body !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "title and body (string) are required" }),
        {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const vapid = getVapid();
    if (!vapid) {
      return new Response(
        JSON.stringify({
          error: "VAPID keys not configured",
          detail:
            "Set VAPID_SUBJECT, VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets in Supabase.",
        }),
        {
          status: 503,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const supabase = createClient(supabaseUrl, serviceKey);

    let q = supabase.from("push_subscriptions").select("*");
    if (targetUserId) {
      q = q.eq("user_id", targetUserId);
    }
    const { data: subs, error: subErr } = await q.limit(MAX_BATCH);
    if (subErr) {
      return new Response(JSON.stringify({ error: subErr.message }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, total: 0 }),
        {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const payload = JSON.stringify({
      title: body.title,
      body: body.body,
      icon: body.icon ?? "/icon-192.png",
      badge: body.badge ?? "/icon-192.png",
      data: { url: body.url ?? "/", ...(body.data ?? {}) },
    });

    let sent = 0;
    let failed = 0;
    const errors: { endpoint?: string; error?: string; statusCode?: number }[] =
      [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { timeout: PUSH_TIMEOUT_MS },
        );
        sent++;
      } catch (e) {
        failed++;
        const err = e as { statusCode?: number };
        const estourou = isPushTimeout(e);
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Inscrição expirada/inválida: limpa para não reaparecer.
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
        errors.push({
          endpoint: sub.endpoint,
          statusCode: err.statusCode,
          // tempo limite nao e inscricao invalida: so o 404/410 do provedor e.
          error: estourou
            ? "timeout"
            : err?.statusCode
            ? undefined
            : (e as Error)?.message,
        });
      }
    }

    log.info(
      `push-send: userId=${targetUserId ?? "all"} total=${subs.length} sent=${sent} failed=${failed}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total: subs.length,
        errors: errors.slice(0, 10),
      }),
      {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error)?.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});

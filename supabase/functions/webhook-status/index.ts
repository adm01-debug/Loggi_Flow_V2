import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { log } from "../_shared/logger.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { requireInternalSecret, requireRole } from "../_shared/auth.ts";
import {
  ValidationError,
  validationErrorResponse,
} from "../_shared/validate.ts";
import { parseWebhookStatusInput } from "./parse.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Webhook Status Edge Function
 * Handles notifying external clients about shipment status changes with HMAC signature validation.
 */
serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    )!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Aceita chamadas internas (x-internal-secret) ou usuários admin
    const isInternal = requireInternalSecret(req);
    const roleAuth = isInternal ? null : await requireRole(req, ["admin"]);
    if (!isInternal && (!roleAuth || !roleAuth.ok)) {
      const status = roleAuth && !roleAuth.ok ? roleAuth.status : 401;
      return new Response(JSON.stringify({ error: status === 403 ? "Forbidden" : "Unauthorized" }), {
        status,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    // sub do usuário autenticado (nulo para chamadas internas)
    const callerSub = (!isInternal && roleAuth?.ok) ? roleAuth.claims.sub : undefined;

    const parsed = parseWebhookStatusInput(
      (await req.json()) as Record<string, unknown>,
    );

    switch (parsed.action) {
      case "notify_status_change": {
        const {
          entrega_id,
          old_status,
          new_status,
          numero_entrega,
          codigo_rastreamento,
        } = parsed.data;

        // Get active webhooks configured for this specific event (status)
        const { data: webhooks, error: whError } = await supabase
          .from("client_webhooks")
          .select("*")
          .eq("active", true);

        if (whError) throw whError;

        // Filter webhooks that match the event
        const relevantWebhooks = (webhooks || []).filter(
          (wh) => wh.events.includes("*") || wh.events.includes(new_status),
        );

        const payload = {
          event: "entrega.status_changed",
          timestamp: new Date().toISOString(),
          data: {
            entrega_id,
            numero_entrega,
            old_status,
            new_status,
            codigo_rastreamento,
          },
        };

        const results = [];

        for (const webhook of relevantWebhooks) {
          try {
            // Generate HMAC-SHA256 signature for security
            const hmacKey = await crypto.subtle.importKey(
              "raw",
              new TextEncoder().encode(webhook.secret),
              { name: "HMAC", hash: "SHA-256" },
              false,
              ["sign"],
            );

            const signature = await crypto.subtle.sign(
              "HMAC",
              hmacKey,
              new TextEncoder().encode(JSON.stringify(payload)),
            );

            const signatureHex = Array.from(new Uint8Array(signature))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");

            // Send notification to external endpoint
            const response = await safeFetch(webhook.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signatureHex,
                "X-Webhook-Event": "entrega.status_changed",
                "User-Agent": "LogiFlow-Webhook-Dispatcher/1.0",
              },
              body: JSON.stringify(payload),
              // Timeout after 10 seconds
              signal: AbortSignal.timeout(10000),
            });

            results.push({
              webhook_id: webhook.id,
              status: response.status,
              success: response.ok,
            });

            // Log delivery attempt with details for auditing
            await supabase.from("webhook_deliveries").insert({
              webhook_id: webhook.id,
              event_type: "entrega.status_changed",
              payload,
              response_status: response.status,
              success: response.ok,
              error_message: response.ok ? null : `HTTP ${response.status}`,
            });
          } catch (err) {
            log.error(`Failed to deliver webhook ${webhook.id}:`, err);
            results.push({
              webhook_id: webhook.id,
              status: 0,
              success: false,
              error:
                err instanceof Error ? err.message : "Unknown delivery error",
            });

            // Log failed delivery
            await supabase.from("webhook_deliveries").insert({
              webhook_id: webhook.id,
              event_type: "entrega.status_changed",
              payload,
              response_status: 0,
              success: false,
              error_message:
                err instanceof Error
                  ? err.message
                  : "Delivery Timeout or Connection Error",
            });
          }
        }

        // Auditoria: registrar quem disparou notificação e para quantos webhooks
        await supabase.from("audit_logs").insert({
          action: "webhook_notify_status_change",
          table_name: "client_webhooks",
          record_id: entrega_id,
          user_id: callerSub ?? null,
          new_data: { processed: relevantWebhooks.length, new_status },
        }).then(() => {/* best-effort */});

        return new Response(
          JSON.stringify({
            success: true,
            processed: relevantWebhooks.length,
            results,
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
      }

      case "list_webhooks": {
        // Filtrar por dono quando chamado por usuário autenticado (não chamada interna)
        const whQuery = supabase
          .from("client_webhooks")
          .select("id, url, events, active, created_at")
          .order("created_at", { ascending: false });
        const { data: webhooks, error } = callerSub
          ? await whQuery.eq("created_by", callerSub)
          : await whQuery;

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: webhooks }), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, headers);
    }
    log.error("Webhook dispatcher critical failure:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }
});

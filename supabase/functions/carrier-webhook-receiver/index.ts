import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";
import { verifyWebhookHmac } from "../_shared/webhookSignature.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { bodyHash, buildEventKey, claimIdempotencyKey } from "../_shared/idempotency.ts";
import { log, redact } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Mapeia status/evento livre de um webhook genérico para o enum entrega_status.
 * Retorna null quando não reconhece — nesse caso a entrega não é tocada.
 */
export function mapCarrierStatus(raw: string): string | null {
  const s = raw.toLowerCase();
  if (s.includes("entreg") || s.includes("delivered") || s === "delivered") {
    return "entregue";
  }
  if (
    s.includes("ocorrenc") ||
    s.includes("problema") ||
    s.includes("incidente")
  ) {
    return "ocorrencia";
  }
  if (
    s.includes("em_transito") ||
    s.includes("transito") ||
    s.includes("in_transit")
  ) {
    return "em_transito";
  }
  if (s.includes("saiu_entrega") || s.includes("out_for_delivery")) {
    return "saiu_entrega";
  }
  if (
    s.includes("despach") ||
    s.includes("despatched") ||
    s.includes("shipped")
  ) {
    return "despachado";
  }
  if (s.includes("finaliz") || s.includes("finished")) {
    return "finalizado";
  }
  if (s.includes("aguardando_producao") || s.includes("pending")) {
    return "aguardando_producao";
  }
  if (s.includes("nf_emitida") || s.includes("invoice")) {
    return "nf_emitida";
  }
  return null;
}

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const rl = await checkRateLimit(req, "carrier-webhook-receiver", {
      maxRequests: 100,
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

    const raw = await req.text();

    // Verify webhook signature
    const signature = req.headers.get("x-webhook-signature") || "";
    if (!(await verifyWebhookHmac(raw, signature, "CARRIER_WEBHOOK_SECRET"))) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(raw);
    log.info("Carrier Webhook received:", redact(payload));

    // Contract Validation
    const { isValid, errors } = await validateContract(
      supabaseClient,
      "carrier-webhook-receiver",
      payload,
      (p) => {
        requireString(p, "carrier_id", { minLength: 2 });
        requireString(p, "event_type", { minLength: 3 });
      },
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: "Contract Violation",
          details: errors,
          nexus_protocol: "SHIELD_GATE_REJECTION",
        }),
        {
          headers: { ...headers, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Idempotency guard: dedupe by (carrier_id + event_id|timestamp)
    // Etapa 141 (B-02): sem `timestamp` a chave antiga virava
    // `carrier_id:event_type:` - a MESMA para todos os eventos daquele tipo, e o
    // segundo evento legitimo era descartado como duplicata. O hash do corpo entra
    // no lugar do vazio, entao payloads diferentes voltam a se distinguir.
    const identificador = payload.event_id || payload.id;
    const eventKey = await buildEventKey(
      `carrier:${payload.carrier_id}`,
      identificador
        ? [identificador]
        : [payload.event_type, payload.timestamp || (await bodyHash(payload))],
      payload,
    );

    if (!eventKey) {
      log.error('Carrier webhook sem identificador estavel, recusando', {
        carrier_id: payload.carrier_id,
        event_type: payload.event_type,
      });
      return new Response(
        JSON.stringify({ error: 'Event without stable identifier' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const idem = await claimIdempotencyKey(eventKey.provider, eventKey.id);
    if (idem.duplicate) {
      return new Response(
        JSON.stringify({
          success: true,
          duplicate: true,
          message: "already processed",
        }),
        { headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    // 1. Audit log
    await supabaseClient.from("automation_audit_logs").insert({
      action_taken: "carrier_webhook_validated",
      payload: payload,
      status: "success",
    });

    // 2. Atualiza a entrega correspondente quando o payload traz identificador de rota
    const applyStatus = mapCarrierStatus(
      payload.status ?? payload.event_type ?? "",
    );
    const trackingCode = payload.codigo_rastreamento || payload.tracking_code;
    const numeroEntrega = payload.numero_entrega || payload.delivery_code;

    if (trackingCode || numeroEntrega) {
      const entregaQuery = supabaseClient
        .from("entregas")
        .select("id, status")
        .limit(1);

      if (trackingCode) {
        entregaQuery.eq("codigo_rastreamento", trackingCode);
      } else {
        entregaQuery.eq("numero_entrega", numeroEntrega);
      }

      const { data: entregas, error: findError } = await entregaQuery;
      if (findError) throw findError;

      const entrega = entregas && entregas.length > 0 ? entregas[0] : undefined;
      if (entrega) {
        const updateData: Record<string, unknown> = {};
        if (applyStatus && applyStatus !== entrega.status) {
          updateData.status = applyStatus;
          if (applyStatus === "entregue") {
            updateData.data_entrega_efetiva =
              payload.entregue_em ??
              payload.timestamp ??
              new Date().toISOString();
            if (payload.recebedor) updateData.recebedor = payload.recebedor;
          }
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseClient
            .from("entregas")
            .update(updateData)
            .eq("id", entrega.id);
          if (updateError) throw updateError;
        }

        if (applyStatus === "ocorrencia") {
          await supabaseClient.from("ocorrencias").insert({
            entrega_id: entrega.id,
            tipo_ocorrencia: `carrier-${payload.carrier_id}`,
            descricao:
              payload.descricao ||
              payload.ocorrencia_descricao ||
              `Ocorrência reportada pela transportadora ${payload.carrier_id}`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Carrier Webhook processed via Nexus Shield",
        entrega_atualizada: Boolean(trackingCode || numeroEntrega),
      }),
      { headers: { ...headers, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    log.error("[carrier-webhook-receiver] Error:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

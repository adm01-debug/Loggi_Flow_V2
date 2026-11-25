import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";
import { log, redact } from "../_shared/logger.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";
import { verifyWebhookHmac } from "../_shared/webhookSignature.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isTestModeRequest } from "../_shared/testMode.ts";

// Map Rodonaves status codes to system entrega_status enum
function mapRodonavesStatus(code: string): string | null {
  const codeNum = parseInt(code, 10);
  // Delivered
  if (codeNum === 1) return "entregue";
  // In transit
  if ([2, 3, 4, 5, 6, 20, 21, 22, 23, 24, 25, 26, 27].includes(codeNum))
    return "em_transito";
  // Out for delivery
  if ([7, 8, 9, 10].includes(codeNum)) return "saiu_entrega";
  // Issues / occurrences (80-85 = extravio, nunca entregue)
  if (
    [
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 60, 61, 62, 63, 64,
      65, 70, 71, 72, 73, 80, 81, 82, 83, 84, 85,
    ].includes(codeNum)
  )
    return "ocorrencia";
  return null;
}

serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // P13: rate limit
    const rl = await checkRateLimit(req, "rodonaves-webhook", {
      maxRequests: 100,
    });
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: rl.message ?? "rate limited" }),
        {
          status: 429,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const raw = await req.text();

    // HMAC signature verification (fail-closed).
    // Test-mode bypass ONLY when ALLOW_TEST_MODE=true is set server-side —
    // clients cannot bypass by sending a header alone.
    // Etapa 011: producao recusa o bypass mesmo com ALLOW_TEST_MODE=true.
    const isTestMode = isTestModeRequest(req);
    if (!isTestMode) {
      const signature = req.headers.get("x-rodonaves-signature") || "";
      if (
        !(await verifyWebhookHmac(raw, signature, "RODONAVES_WEBHOOK_SECRET"))
      ) {
        log.warn("Rodonaves webhook: invalid signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(raw);
    log.info("Rodonaves webhook received:", { payload: redact(payload) });

    // Contract Validation
    const { isValid, errors } = await validateContract(
      supabaseAdmin,
      "rodonaves-webhook",
      payload,
      (p) => {
        if (!p.nf_numero && !p.codigo_rastreamento) {
          throw new Error("nf_numero or codigo_rastreamento is required");
        }
        requireString(p, "status_code");
      },
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: "Contract Violation",
          details: errors,
          nexus_protocol: "RODONAVES_GATE_REJECTION",
        }),
        {
          headers: { ...headers, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const {
      nf_numero,
      status_code,
      status_descricao,
      data_evento,
      codigo_rastreamento,
      recebedor,
      event_id,
    } = payload;

    // Idempotency: use event_id or create one from unique fields
    const finalEventId =
      event_id ||
      `rodonaves-${nf_numero || codigo_rastreamento}-${status_code}-${data_evento}`;

    // Find the entrega
    let query = supabaseAdmin
      .from("entregas")
      .select("id, status, numero_entrega")
      .limit(1);
    if (codigo_rastreamento) {
      query = query.eq("codigo_rastreamento", codigo_rastreamento);
    } else {
      query = query.eq("nf_remessa", nf_numero);
    }

    const { data: entregas, error: findError } = await query;
    if (findError) throw findError;

    if (!entregas || entregas.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Entrega não encontrada" }),
        {
          status: 404,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const entrega = entregas[0];
    const newStatus = mapRodonavesStatus(status_code?.toString() || "");

    if (!newStatus) {
      log.info(`Unknown Rodonaves status code: ${status_code}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Status code não mapeado, ignorado",
        }),
        { headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    // Etapa 135 - grava o marcador de idempotencia ANTES do primeiro write de
    // negocio: o UNIQUE (event_id, provider) resolve a corrida com 23505.
    // Fica depois das saidas que nao gravam nada ("Entrega nao encontrada" e
    // status nao mapeado), para nao descartar evento que precisa ser
    // reprocessado. Fail-open em erro de infraestrutura, igual a
    // _shared/idempotency.ts.
    const { error: markerError } = await supabaseAdmin
      .from("webhook_events_processed")
      .insert({
        event_id: finalEventId,
        provider: "rodonaves",
        payload: payload,
      });

    if (markerError) {
      if (markerError.code === "23505") {
        log.info(
          `Webhook already processed (eventId: ${finalEventId}), skipping`,
        );
        return new Response(
          JSON.stringify({
            success: true,
            duplicate: true,
            message: "Already processed",
          }),
          {
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
      }
      log.warn(
        `Falha ao gravar marcador de idempotencia: ${markerError.message}`,
      );
    }

    // Update entrega
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "entregue") {
      updateData.data_entrega_efetiva = data_evento || new Date().toISOString();
      if (recebedor) updateData.recebedor = recebedor;
    }

    const { error: updateError } = await supabaseAdmin
      .from("entregas")
      .update(updateData)
      .eq("id", entrega.id);

    if (updateError) {
      log.error("[rodonaves-webhook] Falha ao atualizar a entrega:", {
        entrega_id: entrega.id,
        code: updateError.code,
        message: updateError.message,
      });
      throw new Error("Falha ao atualizar a entrega");
    }

    // Register ocorrencia if status is ocorrencia
    if (newStatus === "ocorrencia") {
      await supabaseAdmin.from("ocorrencias").insert([
        {
          entrega_id: entrega.id,
          tipo_ocorrencia: "atraso",
          descricao: `Rodonaves: ${status_descricao || `Código ${status_code}`}`,
        },
      ]);
    }

    log.info(`Entrega ${entrega.numero_entrega} updated to ${newStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        entrega_id: entrega.id,
        new_status: newStatus,
        event_id: finalEventId,
      }),
      { headers: { ...headers, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    log.error("[rodonaves-webhook] Webhook error:", {
      message: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(error, headers, "rodonaves-webhook");
  }
});

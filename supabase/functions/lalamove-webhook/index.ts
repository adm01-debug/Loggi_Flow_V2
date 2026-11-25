import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, redact } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";
import { validateContract } from "../_shared/contract-validator.ts";
import { verifyWebhookHmac } from "../_shared/webhookSignature.ts";
import { requireString } from "../_shared/validate.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { bodyHash, buildEventKey } from "../_shared/idempotency.ts";
import { isTestModeRequest } from "../_shared/testMode.ts";


const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Map Lalamove status to our internal status
function mapLalamoveStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ASSIGNING_DRIVER': 'aguardando_motorista',
    'ON_GOING': 'em_transito',
    'PICKED_UP': 'coletado',
    'COMPLETED': 'entregue',
    'CANCELED': 'cancelado',
    'REJECTED': 'rejeitado',
    'EXPIRED': 'expirado',
  };
  return statusMap[status] || status.toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // P13: rate limit per IP (100 req/min for webhooks)
    const rl = await checkRateLimit(req, "lalamove-webhook", { maxRequests: 100, windowMs: 60_000 });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: rl.message ?? "rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.text();
    const signature = req.headers.get('x-lalamove-signature') || '';
    // Etapa 011: producao recusa o bypass mesmo com ALLOW_TEST_MODE=true.
    const isTestMode = isTestModeRequest(req);

    log.info('Received Lalamove webhook');


    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const webhookData = JSON.parse(payload);

    // Etapa 009 — HMAC antes do contrato: POST sem assinatura recebe 401, não 400.
    // Comparação constante via _shared/webhookSignature.ts.
    if (!isTestMode) {
      const isVerified = await verifyWebhookHmac(payload, signature, 'LALAMOVE_API_SECRET');
      if (!isVerified) {
        log.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Contract Validation
    const { isValid, errors } = await validateContract(
      supabase,
      'lalamove-webhook',
      webhookData,
      (p) => {
        requireString(p, 'eventType');
        if (!p.data) throw new Error('data object is required');
      }
    );

    if (!isValid) {
      return new Response(JSON.stringify({ 
        error: "Contract Violation", 
        details: errors,
        nexus_protocol: "LALAMOVE_GATE_REJECTION"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { eventType, data, eventId } = webhookData;

    // Etapa 139 (B-02): chave aleatoria anula a dedupe. `eventId` isolado e o
    // identificador forte; sem ele, orderId + status + momento do evento ainda
    // identificam - e o `status` entra porque duas mudancas de status do MESMO
    // pedido sao dois eventos legitimos. `eventType` sozinho nao identifica nada
    // (dois eventos do mesmo tipo colidiriam), entao sem orderId recusamos.
    const partesEvento: Array<string | undefined> = [eventId];
    if (!eventId && data?.orderId) {
      const quando = data?.timestamp || (await bodyHash(data));
      partesEvento.push(`${data.orderId}-${data.status ?? ""}-${quando}`);
    }

    const eventKey = await buildEventKey('lalamove', partesEvento);

    if (!eventKey) {
      log.error('Lalamove webhook sem identificador estavel, recusando', {
        eventType,
        payload: redact(webhookData),
      });
      return new Response(JSON.stringify({ error: 'Event without stable identifier' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const finalEventId = eventKey.id;

    log.info('Processing Lalamove webhook', { eventType, eventId: finalEventId });

    // Etapa 133 - grava o marcador ANTES de processar: o UNIQUE
    // (event_id, provider) resolve a corrida entre duas entregas simultaneas
    // do mesmo evento com 23505. Fail-open em erro de infraestrutura, igual a
    // _shared/idempotency.ts.
    const { error: markerError } = await supabase
      .from('webhook_events_processed')
      .insert({
        event_id: finalEventId,
        provider: 'lalamove',
        payload: webhookData
      });

    if (markerError) {
      if (markerError.code === '23505') {
        log.info('Webhook already processed, skipping', { eventId: finalEventId });
        return new Response(JSON.stringify({ success: true, duplicate: true, message: 'Already processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      log.warn('Falha ao gravar marcador de idempotencia, seguindo', {
        eventId: finalEventId,
        error: markerError.message,
      });
    }

    switch (eventType) {
      case 'ORDER_STATUS_CHANGED': {
        const { orderId, status, timestamp } = data;
        
        const { error: historyError } = await supabase
          .from('rastreamento_historico')
          .insert({
            lalamove_order_id: orderId,
            order_status: mapLalamoveStatus(status),
            latitude: data.location?.lat || 0,
            longitude: data.location?.lng || 0,
            recorded_at: timestamp || new Date().toISOString(),
          });

        if (historyError) log.error('Error saving status history:', historyError);

        if (status === 'COMPLETED') {
          await supabase
            .from('coletas')
            .update({ status: 'chegou_expedicao' })
            .eq('codigo_rastreamento', orderId);
        }
        break;
      }

      case 'DRIVER_LOCATION_UPDATED': {
        const { orderId, driverId, location, timestamp } = data;
        await supabase
          .from('rastreamento_historico')
          .insert({
            lalamove_order_id: orderId,
            driver_id: driverId,
            latitude: location.lat,
            longitude: location.lng,
            recorded_at: timestamp || new Date().toISOString(),
          });
        break;
      }

      case 'DRIVER_ASSIGNED': {
        const { orderId, driver } = data;
        await supabase
          .from('rastreamento_historico')
          .insert({
            lalamove_order_id: orderId,
            driver_id: driver.driverId,
            driver_name: driver.name,
            driver_phone: driver.phone,
            driver_plate: driver.plateNumber,
            latitude: driver.location?.lat || 0,
            longitude: driver.location?.lng || 0,
            order_status: 'motorista_alocado',
            recorded_at: new Date().toISOString(),
          });
        break;
      }

      case 'ORDER_CANCELED':
      case 'ORDER_EXPIRED': {
        const { orderId, reason } = data;
        await supabase
          .from('rastreamento_alertas')
          .insert({
            lalamove_order_id: orderId,
            alert_type: eventType === 'ORDER_CANCELED' ? 'order_canceled' : 'order_expired',
            severity: 'high',
            message: `Pedido ${eventType === 'ORDER_CANCELED' ? 'cancelado' : 'expirado'}: ${reason || 'Sem motivo informado'}`,
          });
        break;
      }
    }

    return new Response(JSON.stringify({ success: true, eventType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    log.error('[lalamove-webhook] Webhook processing error:', {
      message: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(error, corsHeaders, 'lalamove-webhook');
  }
});

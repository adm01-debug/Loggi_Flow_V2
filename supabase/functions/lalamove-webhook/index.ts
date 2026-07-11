import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";


const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Verify Lalamove webhook signature using HMAC-SHA256
async function verifySignature(payload: string, signature: string): Promise<boolean> {
  const secret = Deno.env.get('LALAMOVE_API_SECRET');
  if (!secret) {
    log.error('LALAMOVE_API_SECRET missing — refusing webhook (fail-closed)');
    return false;
  }
  if (!signature) {
    log.warn('Missing x-lalamove-signature header');
    return false;
  }


  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedSignature === signature;
  } catch (error) {
    log.error('Signature verification error:', error);
    return false;
  }
}

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
    const isTestMode = req.headers.get('x-test-mode') === 'true';

    log.info('Received Lalamove webhook');


    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const webhookData = JSON.parse(payload);

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

    // Skip signature verification in test mode (internal testing only)
    if (!isTestMode) {
      const isVerified = await verifySignature(payload, signature);
      if (!isVerified) {
        log.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { eventType, data, eventId } = webhookData;
    const finalEventId = eventId || data?.orderId || crypto.randomUUID();

    log('INFO', 'Processing Lalamove webhook', { eventType, eventId: finalEventId });

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from('webhook_events_processed')
      .select('id')
      .eq('event_id', finalEventId)
      .eq('provider', 'lalamove')
      .maybeSingle();

    if (existingEvent) {
      log('INFO', 'Webhook already processed, skipping', { eventId: finalEventId });
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    // Mark as processed
    await supabase.from('webhook_events_processed').insert({
      event_id: finalEventId,
      provider: 'lalamove',
      payload: webhookData
    });

    return new Response(JSON.stringify({ success: true, eventType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    log('ERROR', 'Webhook processing error', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

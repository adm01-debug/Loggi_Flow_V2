import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";
import { verifyWebhookHmac } from "../_shared/webhookSignature.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { log } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rl = await checkRateLimit(req, "nexus-webhook-receiver", { maxRequests: 200, windowMs: 60_000 });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) },
      });
    }

    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    // HMAC is enforced when NEXUS_WEBHOOK_SECRET is configured (fail-closed)
    if (Deno.env.get("NEXUS_WEBHOOK_SECRET")) {
      if (!(await verifyWebhookHmac(raw, signature, "NEXUS_WEBHOOK_SECRET"))) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = JSON.parse(raw);
    log.info('Nexus Webhook received');

    // Contract Validation
    const { isValid, errors } = await validateContract(
      supabaseClient,
      'nexus-webhook-receiver',
      body,
      (p) => {
        if (p.event === 'messages.upsert') {
          requireString(p, 'event');
          if (!p.data) throw new Error('data is required for messages.upsert');
        } else if (p.source === 'generic_api') {
          requireString(p, 'source');
          requireString(p, 'carrier_id');
          requireString(p, 'text');
        } else {
          throw new Error('Unsupported event source or type');
        }
      }
    );

    if (!isValid) {
      return new Response(JSON.stringify({ 
        error: "Contract Violation", 
        details: errors,
        nexus_protocol: "CORE_GATE_REJECTION"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 1. Identify source (WhatsApp Evolution API usually sends 'messages-upsert')
    if (body.event === 'messages.upsert') {
      const message = body.data?.message;
      const remoteJid = body.data?.key?.remoteJid; // e.g. "5511999999999@s.whatsapp.net"
      const text = message?.conversation || message?.extendedTextMessage?.text;

      if (!text || !remoteJid) {
        return new Response(JSON.stringify({ success: false, error: 'No text or remoteJid' }), { headers: corsHeaders });
      }

      const phone = remoteJid.split('@')[0];

      // 2. Find transportadora by phone
      const { data: carrier } = await supabaseClient
        .from('transportadoras')
        .select('id, nome_fantasia')
        .or(`contato_whatsapp.ilike.%${phone}%,non_api_config->>phone.eq.${phone}`)
        .single();

      if (!carrier) {
        log.info('No carrier found for phone:', phone);
        return new Response(JSON.stringify({ success: false, error: 'Carrier not found' }), { headers: corsHeaders });
      }

      // 3. Find latest pending quote for this carrier
      const { data: cotacao } = await supabaseClient
        .from('cotacoes_multicanal')
        .select('id')
        .eq('transportadora_id', carrier.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!cotacao) {
        log.info('No pending quote for carrier:', carrier.nome_fantasia);
        return new Response(JSON.stringify({ success: false, error: 'No pending quote' }), { headers: corsHeaders });
      }

      // 4. Normalize response
      log.info('Normalizing text:', text);
      const normalizationResponse = await supabaseClient.functions.invoke('normalize-freight-response', {
        body: { text, transportadora_id: carrier.id, cotacao_id: cotacao.id }
      });

      return new Response(
        JSON.stringify({ success: true, carrier: carrier.nome_fantasia, normalization: normalizationResponse.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle generic incoming webhooks (e.g. from generic API)
    if (body.source === 'generic_api') {
        const { carrier_id, text, cotacao_id } = body;
        const normalizationResponse = await supabaseClient.functions.invoke('normalize-freight-response', {
            body: { text, transportadora_id: carrier_id, cotacao_id }
        });
        return new Response(JSON.stringify({ success: true, data: normalizationResponse.data }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, message: 'Webhook ignored or not handled' }), { headers: corsHeaders });

  } catch (error: any) {
    log.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

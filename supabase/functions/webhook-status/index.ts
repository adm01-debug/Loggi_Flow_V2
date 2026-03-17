import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, data } = await req.json();

    switch (action) {
      case 'notify_status_change': {
        const { entrega_id, old_status, new_status, numero_entrega, codigo_rastreamento } = data;

        // Get active webhooks
        const { data: webhooks, error: whError } = await supabase
          .from('client_webhooks')
          .select('*')
          .eq('active', true)
          .contains('events', [new_status]);

        if (whError) throw whError;

        const payload = {
          event: 'entrega.status_changed',
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

        for (const webhook of (webhooks || [])) {
          try {
            const hmacKey = await crypto.subtle.importKey(
              'raw',
              new TextEncoder().encode(webhook.secret),
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign']
            );

            const signature = await crypto.subtle.sign(
              'HMAC',
              hmacKey,
              new TextEncoder().encode(JSON.stringify(payload))
            );

            const signatureHex = Array.from(new Uint8Array(signature))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');

            const response = await fetch(webhook.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signatureHex,
                'X-Webhook-Event': 'entrega.status_changed',
              },
              body: JSON.stringify(payload),
            });

            results.push({
              webhook_id: webhook.id,
              status: response.status,
              success: response.ok,
            });

            // Log delivery
            await supabase.from('webhook_deliveries').insert({
              webhook_id: webhook.id,
              event_type: 'entrega.status_changed',
              payload,
              response_status: response.status,
              success: response.ok,
            });
          } catch (err) {
            results.push({
              webhook_id: webhook.id,
              status: 0,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }

        return new Response(
          JSON.stringify({ success: true, delivered: results.length, results }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list_webhooks': {
        const { data: webhooks, error } = await supabase
          .from('client_webhooks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, data: webhooks }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Webhook status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

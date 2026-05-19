import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log('Carrier Webhook received:', payload)

    // Contract Validation
    const { isValid, errors } = await validateContract(
      supabaseClient,
      'carrier-webhook-receiver',
      payload,
      (p) => {
        requireString(p, 'carrier_id', { minLength: 2 });
        requireString(p, 'event_type', { minLength: 3 });
      }
    )

    if (!isValid) {
      return new Response(JSON.stringify({ 
        error: "Contract Violation", 
        details: errors,
        nexus_protocol: "SHIELD_GATE_REJECTION"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 1. Audit log
    await supabaseClient.from('automation_audit_logs').insert({
      action_taken: 'carrier_webhook_validated',
      payload: payload,
      status: 'success'
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Carrier Webhook processed via Nexus Shield' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
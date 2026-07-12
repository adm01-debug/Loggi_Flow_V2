import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";
import { verifyWebhookHmac } from "../_shared/webhookSignature.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { claimIdempotencyKey } from "../_shared/idempotency.ts";
import { log } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const rl = await checkRateLimit(req, "carrier-webhook-receiver", { maxRequests: 100, windowMs: 60_000 });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) },
      });
    }

    const raw = await req.text();

    // Verify webhook signature
    const signature = req.headers.get("x-webhook-signature") || "";
    if (!(await verifyWebhookHmac(raw, signature, "CARRIER_WEBHOOK_SECRET"))) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(raw);
    log.info("Carrier Webhook received:", payload);

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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 1. Audit log
    await supabaseClient.from("automation_audit_logs").insert({
      action_taken: "carrier_webhook_validated",
      payload: payload,
      status: "success",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Carrier Webhook processed via Nexus Shield",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    log.error("[carrier-webhook-receiver] Error:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

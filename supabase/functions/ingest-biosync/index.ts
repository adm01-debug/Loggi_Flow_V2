import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { log } from "../_shared/logger.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";
import { ValidationError, validationErrorResponse } from "../_shared/validate.ts";
import { parseBioSyncInput } from "./parse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { driver_id, vehicle_id, heart_rate, fatigue_index } =
      parseBioSyncInput((await req.json()) as Record<string, unknown>);

    // 1. Fetch Alert Rules
    const { data: rules } = await supabaseClient
      .from("bio_sync_alert_rules")
      .select("*")
      .limit(1)
      .maybeSingle();

    const warningThreshold = rules?.bpm_warning_threshold || 100;
    const criticalThreshold = rules?.bpm_critical_threshold || 120;
    
    let severity = "info";
    if (heart_rate >= criticalThreshold) severity = "crit";
    else if (heart_rate >= warningThreshold) severity = "warn";

    // 2. Insert Telemetry
    const { data: telemetry, error } = await supabaseClient
      .from("bio_sync_telemetry")
      .insert({
        driver_id,
        vehicle_id,
        heart_rate, // validado: número na faixa fisiológica (20-300)
        fatigue_index, // validado: "LOW" quando ausente
        severity,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Proactive Tactical Log
    if (severity !== "info") {
      await supabaseClient.from("nexus_tactical_logs").insert({
        message: `BIO_SYNC: ${severity.toUpperCase()} Alert - BPM: ${heart_rate} for Vehicle ${vehicle_id}`,
        type: severity,
        target_vehicle: vehicle_id,
        event_time: new Date().toISOString()
      });

      // 4. Proactive Bitrix24 Integration (only for critical)
      if (severity === "crit") {
        const aviso = await invokeFunction("bitrix24-integration", {
          action: "notify_alert",
          deal_data: {
            message: `CRITICAL HEART RATE DETECTED: ${heart_rate} BPM`,
            severity: "crit",
            vehicle_id,
            driver_id,
          },
        });

        if (!aviso.ok) {
          log.error("Failed to notify Bitrix24:", { reason: aviso.reason });
        }
      }
    }

    return new Response(JSON.stringify(telemetry), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

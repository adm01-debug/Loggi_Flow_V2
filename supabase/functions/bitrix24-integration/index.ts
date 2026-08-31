import { safeFetch } from "../_shared/safeFetch.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BitrixRequest {
  action: "sync_deals" | "update_deal" | "get_deals" | "create_deal" | "webhook" | "notify_alert";
  deal_id?: string;
  deal_data?: Record<string, unknown>;
  spa_id?: number;
  filters?: Record<string, unknown>;
  webhook_data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const bitrixWebhookUrl = Deno.env.get("BITRIX24_WEBHOOK_URL");

    if (!bitrixWebhookUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "BITRIX24_WEBHOOK_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: BitrixRequest = await req.json();

    switch (body.action) {
      case "get_deals": {
        const spaId = body.spa_id || 1186; // Default: Gestão Compras
        const response = await safeFetch(`${bitrixWebhookUrl}/crm.item.list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: spaId,
            filter: body.filters || {},
            select: ["id", "title", "stageId", "assignedById", "createdTime", "updatedTime", "ufCrm*"],
          }),
        });

        const data = await response.json();
        if (data.error) {
          return new Response(
            JSON.stringify({ success: false, error: data.error_description || data.error }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, deals: data.result?.items || [], total: data.total }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_deal": {
        if (!body.deal_id || !body.deal_data) {
          return new Response(
            JSON.stringify({ success: false, error: "deal_id and deal_data are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const spaId = body.spa_id || 1186;
        const response = await safeFetch(`${bitrixWebhookUrl}/crm.item.update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: spaId,
            id: body.deal_id,
            fields: body.deal_data,
          }),
        });

        const data = await response.json();
        if (data.error) {
          return new Response(
            JSON.stringify({ success: false, error: data.error_description || data.error }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, updated: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_deal": {
        if (!body.deal_data) {
          return new Response(
            JSON.stringify({ success: false, error: "deal_data is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const spaId = body.spa_id || 1234; // Default: Entregas Log
        const response = await safeFetch(`${bitrixWebhookUrl}/crm.item.add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: spaId,
            fields: body.deal_data,
          }),
        });

        const data = await response.json();
        if (data.error) {
          return new Response(
            JSON.stringify({ success: false, error: data.error_description || data.error }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, deal_id: data.result?.item?.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync_deals": {
        // Sync coletas from SPA 1186 (Gestão Compras)
        const coletasResponse = await safeFetch(`${bitrixWebhookUrl}/crm.item.list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: 1186,
            filter: { ">=updatedTime": getLastSyncTime() },
            select: ["id", "title", "stageId", "assignedById", "createdTime", "updatedTime", "ufCrm*"],
          }),
        });
        const coletasData = await coletasResponse.json();

        // Sync entregas from SPA 1234 (Entregas Log)
        const entregasResponse = await safeFetch(`${bitrixWebhookUrl}/crm.item.list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: 1234,
            filter: { ">=updatedTime": getLastSyncTime() },
            select: ["id", "title", "stageId", "assignedById", "createdTime", "updatedTime", "ufCrm*"],
          }),
        });
        const entregasData = await entregasResponse.json();

        // Sync Ocorrências from SPA 1050 (New: Ocorrências Log)
        const ocorrenciasResponse = await safeFetch(`${bitrixWebhookUrl}/crm.item.list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: 1050, 
            filter: { ">=updatedTime": getLastSyncTime() },
            select: ["id", "title", "stageId", "assignedById", "createdTime", "updatedTime", "ufCrm*"],
          }),
        });
        const ocorrenciasData = await ocorrenciasResponse.json();

        const syncResults = {
          coletas_synced: coletasData.result?.items?.length || 0,
          entregas_synced: entregasData.result?.items?.length || 0,
          ocorrencias_synced: ocorrenciasData.result?.items?.length || 0,
          synced_at: new Date().toISOString(),
        };

        // Log sync event
        await supabase.from("audit_logs").insert({
          table_name: "bitrix24_sync",
          record_id: "sync_" + Date.now(),
          action: "SYNC",
          new_data: syncResults,
        });

        return new Response(
          JSON.stringify({ success: true, ...syncResults }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "webhook": {
        // Process incoming Bitrix24 webhook
        const webhookData = body.webhook_data;
        if (!webhookData) {
          return new Response(
            JSON.stringify({ success: false, error: "webhook_data required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log the webhook event
        await supabase.from("audit_logs").insert({
          table_name: "bitrix24_webhook",
          record_id: String(webhookData.id || "unknown"),
          action: "WEBHOOK",
          new_data: webhookData,
        });

        return new Response(
          JSON.stringify({ success: true, processed: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "notify_alert": {
        const { message, severity, vehicle_id, driver_id } = body.deal_data || {};
        
        // In Bitrix24, we can create a "Timeline Item" or a "Notification"
        // Here we'll create a CRM activity/task for the assigned user of a default deal or unit
        const response = await safeFetch(`${bitrixWebhookUrl}/crm.activity.add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              OWNER_TYPE_ID: 2, // Deal
              OWNER_ID: 1, // Default CCO Deal or similar
              TYPE_ID: 2, // Call/Meeting/Task
              SUBJECT: `BIO_SYNC ALERT: ${severity === 'crit' ? 'CRITICAL' : 'WARNING'}`,
              COMPLETED: "N",
              PRIORITY: severity === 'crit' ? 2 : 1,
              DESCRIPTION: `${message}\nVehicle: ${vehicle_id}\nDriver: ${driver_id}\nTime: ${new Date().toLocaleString()}`,
              RESPONSIBLE_ID: 1 // Default Admin/CCO
            }
          }),
        });

        const data = await response.json();
        return new Response(
          JSON.stringify({ success: !data.error, result: data.result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${body.action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    log.error("Bitrix24 integration error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getLastSyncTime(): string {
  // Default: last 24 hours
  const date = new Date();
  date.setHours(date.getHours() - 24);
  return date.toISOString();
}
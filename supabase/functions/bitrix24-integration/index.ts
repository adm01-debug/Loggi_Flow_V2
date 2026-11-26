import { safeFetch } from "../_shared/safeFetch.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface BitrixRequest {
  action:
    | "test-connection"
    | "sync_deals"
    | "update_deal"
    | "get_deals"
    | "create_deal"
    | "webhook"
    | "notify_alert";
  deal_id?: string;
  deal_data?: Record<string, unknown>;
  spa_id?: number;
  filters?: Record<string, unknown>;
  webhook_data?: Record<string, unknown>;
}

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ENV tem precedência; sem ela, usa o webhook_url salvo pela tela de
    // configuração em bitrix_sync_config.
    let bitrixWebhookUrl = Deno.env.get("BITRIX24_WEBHOOK_URL");
    if (!bitrixWebhookUrl) {
      const { data: cfg } = await supabase
        .from("bitrix_sync_config")
        .select("webhook_url")
        .eq("is_active", true)
        .maybeSingle();
      if (cfg?.webhook_url) bitrixWebhookUrl = cfg.webhook_url;
    }

    if (!bitrixWebhookUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BITRIX24_WEBHOOK_URL not configured",
        }),
        {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    // IDs das SPAs vem da tela de regras do negocio (business_rules_config); o
    // literal e o ultimo recurso, para a integracao nao parar se a tabela falhar.
    const SPA_IDS_PADRAO = { coletas: 1186, entregas: 1234, ocorrencias: 1050 };
    const spaIds = { ...SPA_IDS_PADRAO };
    try {
      const { data: regras } = await supabase
        .from("business_rules_config")
        .select("key, value")
        .in("key", [
          "bitrix_spa_coletas_id",
          "bitrix_spa_entregas_id",
          "bitrix_spa_ocorrencias_id",
        ]);
      for (const r of regras ?? []) {
        const id = Number(r.value);
        if (!Number.isInteger(id) || id <= 0) continue;
        if (r.key === "bitrix_spa_coletas_id") spaIds.coletas = id;
        else if (r.key === "bitrix_spa_entregas_id") spaIds.entregas = id;
        else if (r.key === "bitrix_spa_ocorrencias_id") spaIds.ocorrencias = id;
      }
    } catch (e) {
      log.warn("bitrix24-integration: business_rules_config indisponivel", {
        error: String(e),
        padrao: SPA_IDS_PADRAO,
      });
    }

    const body: BitrixRequest = await req.json();

    switch (body.action) {
      case "test-connection": {
        // Safe, side-effect-free reachability check used by the integrations panel.
        const response = await safeFetch(`${bitrixWebhookUrl}/crm.item.list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: body.spa_id || spaIds.coletas,
            filter: { ">=updatedTime": getLastSyncTime() },
            select: ["id"],
            start: -1, // Bitrix returns only count, no items, for limit -1
          }),
        });

        const data = await response.json();
        if (data.error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: data.error_description || data.error,
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        return new Response(
          JSON.stringify({ success: true, connected: true, total: data.total }),
          { headers: { ...headers, "Content-Type": "application/json" } },
        );
      }

      case "get_deals": {
        const spaId = body.spa_id || spaIds.coletas; // Default: Gestão Compras
        const response = await safeFetch(`${bitrixWebhookUrl}/crm.item.list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypeId: spaId,
            filter: body.filters || {},
            select: [
              "id",
              "title",
              "stageId",
              "assignedById",
              "createdTime",
              "updatedTime",
              "ufCrm*",
            ],
          }),
        });

        const data = await response.json();
        if (data.error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: data.error_description || data.error,
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            deals: data.result?.items || [],
            total: data.total,
          }),
          { headers: { ...headers, "Content-Type": "application/json" } },
        );
      }

      case "update_deal": {
        if (!body.deal_id || !body.deal_data) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "deal_id and deal_data are required",
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        const spaId = body.spa_id || spaIds.coletas;
        const response = await safeFetch(
          `${bitrixWebhookUrl}/crm.item.update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityTypeId: spaId,
              id: body.deal_id,
              fields: body.deal_data,
            }),
          },
        );

        const data = await response.json();
        if (data.error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: data.error_description || data.error,
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        return new Response(JSON.stringify({ success: true, updated: true }), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      case "create_deal": {
        if (!body.deal_data) {
          return new Response(
            JSON.stringify({ success: false, error: "deal_data is required" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        const spaId = body.spa_id || spaIds.entregas; // Default: Entregas Log
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
            JSON.stringify({
              success: false,
              error: data.error_description || data.error,
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        return new Response(
          JSON.stringify({ success: true, deal_id: data.result?.item?.id }),
          { headers: { ...headers, "Content-Type": "application/json" } },
        );
      }

      case "sync_deals": {
        // Sync coletas (SPA de Compras de business_rules_config)
        const coletasResponse = await safeFetch(
          `${bitrixWebhookUrl}/crm.item.list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityTypeId: spaIds.coletas,
              filter: { ">=updatedTime": getLastSyncTime() },
              select: [
                "id",
                "title",
                "stageId",
                "assignedById",
                "createdTime",
                "updatedTime",
                "ufCrm*",
              ],
            }),
          },
        );
        const coletasData = await coletasResponse.json();

        // Sync entregas (SPA de Entregas de business_rules_config)
        const entregasResponse = await safeFetch(
          `${bitrixWebhookUrl}/crm.item.list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityTypeId: spaIds.entregas,
              filter: { ">=updatedTime": getLastSyncTime() },
              select: [
                "id",
                "title",
                "stageId",
                "assignedById",
                "createdTime",
                "updatedTime",
                "ufCrm*",
              ],
            }),
          },
        );
        const entregasData = await entregasResponse.json();

        // Sync ocorrencias (SPA de Ocorrencias de business_rules_config)
        const ocorrenciasResponse = await safeFetch(
          `${bitrixWebhookUrl}/crm.item.list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityTypeId: spaIds.ocorrencias,
              filter: { ">=updatedTime": getLastSyncTime() },
              select: [
                "id",
                "title",
                "stageId",
                "assignedById",
                "createdTime",
                "updatedTime",
                "ufCrm*",
              ],
            }),
          },
        );
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

        return new Response(JSON.stringify({ success: true, ...syncResults }), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      case "webhook": {
        // Process incoming Bitrix24 webhook
        const webhookData = body.webhook_data;
        if (!webhookData) {
          return new Response(
            JSON.stringify({ success: false, error: "webhook_data required" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
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
          { headers: { ...headers, "Content-Type": "application/json" } },
        );
      }

      case "notify_alert": {
        const { message, severity, vehicle_id, driver_id } =
          body.deal_data || {};

        // In Bitrix24, we can create a "Timeline Item" or a "Notification"
        // Here we'll create a CRM activity/task for the assigned user of a default deal or unit
        const response = await safeFetch(
          `${bitrixWebhookUrl}/crm.activity.add`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: {
                OWNER_TYPE_ID: 2, // Deal
                OWNER_ID: 1, // Default CCO Deal or similar
                TYPE_ID: 2, // Call/Meeting/Task
                SUBJECT: `BIO_SYNC ALERT: ${
                  severity === "crit" ? "CRITICAL" : "WARNING"
                }`,
                COMPLETED: "N",
                PRIORITY: severity === "crit" ? 2 : 1,
                DESCRIPTION: `${message}\nVehicle: ${vehicle_id}\nDriver: ${driver_id}\nTime: ${new Date().toLocaleString()}`,
                RESPONSIBLE_ID: 1, // Default Admin/CCO
              },
            }),
          },
        );

        const data = await response.json();
        return new Response(
          JSON.stringify({ success: !data.error, result: data.result }),
          { headers: { ...headers, "Content-Type": "application/json" } },
        );
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${body.action}`,
          }),
          {
            status: 400,
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    log.error("Bitrix24 integration error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }
});

function getLastSyncTime(): string {
  // Default: last 24 hours
  const date = new Date();
  date.setHours(date.getHours() - 24);
  return date.toISOString();
}

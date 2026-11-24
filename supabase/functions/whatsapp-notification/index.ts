import { safeFetch } from "../_shared/safeFetch.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface WhatsAppRequest {
  action:
    | "send_status_update"
    | "send_delivery_notification"
    | "send_collection_alert"
    | "send_delay_alert"
    | "send_normalization_alert"
    | "send_custom";
  phone: string;
  entrega_id?: string;
  coleta_id?: string;
  template?: string;
  variables?: Record<string, string>;
}

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
    const evolutionInstance =
      Deno.env.get("EVOLUTION_INSTANCE_NAME") || "PRINCIPAL";

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "EVOLUTION_API_URL/EVOLUTION_API_KEY not configured",
        }),
        {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: WhatsAppRequest = await req.json();

    if (!body.phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number is required" }),
        {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    // Normalize phone number to Brazilian format
    const normalizedPhone = normalizePhone(body.phone);

    let message = "";
    let templateName = "";

    switch (body.action) {
      case "send_status_update": {
        if (!body.entrega_id) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "entrega_id required for status updates",
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        const { data: entrega, error } = await supabase
          .from("entregas")
          .select(
            "numero_entrega, status, previsao_entrega, codigo_rastreamento, endereco_entrega",
          )
          .eq("id", body.entrega_id)
          .single();

        if (error || !entrega) {
          return new Response(
            JSON.stringify({ success: false, error: "Delivery not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        const statusLabels: Record<string, string> = {
          aguardando_producao: "Aguardando Produção",
          pronto_despacho: "Pronto para Despacho",
          cotacao_frete: "Cotando Frete",
          nf_emitida: "NF Emitida",
          despachado: "Despachado",
          em_transito: "Em Trânsito",
          saiu_entrega: "Saiu para Entrega",
          entregue: "Entregue",
          ocorrencia: "Ocorrência",
          finalizado: "Finalizado",
        };

        const statusLabel = statusLabels[entrega.status] || entrega.status;
        templateName = "status_update";
        message =
          `🚚 *LogiFlow - Atualização de Entrega*\n\n` +
          `Pedido: *${entrega.numero_entrega}*\n` +
          `Status: *${statusLabel}*\n` +
          (entrega.codigo_rastreamento
            ? `Rastreamento: ${entrega.codigo_rastreamento}\n`
            : "") +
          (entrega.previsao_entrega
            ? `Previsão: ${formatDate(entrega.previsao_entrega)}\n`
            : "") +
          `\nAcompanhe em tempo real pelo nosso portal de rastreamento.`;
        break;
      }

      case "send_delivery_notification": {
        if (!body.entrega_id) {
          return new Response(
            JSON.stringify({ success: false, error: "entrega_id required" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        const { data: entrega } = await supabase
          .from("entregas")
          .select(
            "numero_entrega, recebedor, data_entrega_efetiva, endereco_entrega",
          )
          .eq("id", body.entrega_id)
          .single();

        if (!entrega) {
          return new Response(
            JSON.stringify({ success: false, error: "Delivery not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        templateName = "delivery_confirmed";
        message =
          `✅ *LogiFlow - Entrega Confirmada*\n\n` +
          `Pedido: *${entrega.numero_entrega}*\n` +
          `Entregue em: *${formatDate(entrega.data_entrega_efetiva)}*\n` +
          (entrega.recebedor ? `Recebedor: ${entrega.recebedor}\n` : "") +
          `\nObrigado pela confiança!`;
        break;
      }

      case "send_collection_alert": {
        if (!body.coleta_id) {
          return new Response(
            JSON.stringify({ success: false, error: "coleta_id required" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        const { data: coleta } = await supabase
          .from("coletas")
          .select(
            "numero_coleta, data_prevista_coleta, endereco_coleta, status",
          )
          .eq("id", body.coleta_id)
          .single();

        if (!coleta) {
          return new Response(
            JSON.stringify({ success: false, error: "Collection not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }

        templateName = "collection_alert";
        message =
          `📦 *LogiFlow - Coleta Agendada*\n\n` +
          `Coleta: *${coleta.numero_coleta}*\n` +
          `Data prevista: *${formatDate(coleta.data_prevista_coleta)}*\n` +
          `Endereço: ${coleta.endereco_coleta}\n` +
          `\nPor favor, tenha o material pronto para retirada.`;
        break;
      }

      case "send_delay_alert": {
        templateName = "delay_alert";
        message =
          `⚠️ *LogiFlow - Alerta de Atraso*\n\n` +
          `A remessa *${body.variables?.numero || "N/A"}* está com atraso detectado.\n` +
          `Ação recomendada: Contatar transportadora *${body.variables?.transportadora || "N/A"}*.\n` +
          `Link: https://loggi-flow-v2.vercel.app/rastrear?code=${body.entrega_id || ""}`;
        break;
      }

      case "send_normalization_alert": {
        templateName = "normalization_fail";
        message =
          `❌ *LogiFlow - Falha de Normalização*\n\n` +
          `Ocorreu uma falha ao processar a resposta da transportadora *${body.variables?.transportadora || "N/A"}*.\n` +
          `Cotação ID: *${body.variables?.cotacao_id || "N/A"}*\n` +
          `Necessário intervenção manual no painel Nexus.`;
        break;
      }

      case "send_custom": {
        if (!body.template) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "template required for custom messages",
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }
        templateName = body.template;
        message = body.variables?.message || "Mensagem do LogiFlow";
        break;
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

    // Send via Evolution API (EVO) — nosso próprio sistema WhatsApp
    const evolutionResponse = await safeFetch(
      `${evolutionApiUrl}/message/sendText/${evolutionInstance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionApiKey,
        },
        body: JSON.stringify({
          number: normalizedPhone,
          text: message,
        }),
      },
    );

    const evolutionData = await evolutionResponse.json();

    if (!evolutionResponse.ok) {
      log.error("Evolution API error:", evolutionData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send WhatsApp message",
          details: evolutionData,
        }),
        {
          status: 502,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    // Log the notification
    await supabase.from("audit_logs").insert({
      table_name: "whatsapp_notification",
      record_id: body.entrega_id || body.coleta_id || "custom",
      action: "SEND",
      new_data: {
        phone: normalizedPhone,
        template: templateName,
        action: body.action,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: evolutionData.key?.id || evolutionData.key?.remoteJid,
      }),
      { headers: { ...headers, "Content-Type": "application/json" } },
    );
  } catch (error) {
    log.error("WhatsApp notification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }
});

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  if (digits.length === 11) return `55${digits}`;
  if (digits.length === 10) return `55${digits}`;
  return `55${digits}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

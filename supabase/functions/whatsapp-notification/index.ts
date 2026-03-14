import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

/**
 * WhatsApp notification via A-Ticket API.
 * Sends templated messages for delivery status changes.
 * 
 * Required secrets: ATICKET_API_KEY, ATICKET_API_URL
 */

interface WhatsAppRequest {
  phone: string;
  template: "delivery_dispatched" | "delivery_in_transit" | "delivery_out" | "delivery_completed" | "delay_alert" | "collection_scheduled";
  variables: Record<string, string>;
}

const TEMPLATES: Record<string, string> = {
  delivery_dispatched: "Olá {{nome}}! Seu pedido {{numero}} foi despachado pela transportadora {{transportadora}}. Previsão de entrega: {{previsao}}. Rastreie: {{link}}",
  delivery_in_transit: "Olá {{nome}}! Seu pedido {{numero}} está em trânsito. Previsão: {{previsao}}. Acompanhe: {{link}}",
  delivery_out: "Olá {{nome}}! Seu pedido {{numero}} saiu para entrega! Você receberá em breve. Rastreie: {{link}}",
  delivery_completed: "Olá {{nome}}! Seu pedido {{numero}} foi entregue com sucesso! Obrigado pela preferência 🎉",
  delay_alert: "⚠️ Atenção {{nome}}: a entrega {{numero}} está com atraso. Nova previsão: {{previsao}}. Desculpe pelo inconveniente.",
  collection_scheduled: "Olá {{nome}}! Uma coleta foi agendada para amanhã ({{data}}) no endereço: {{endereco}}. Número: {{numero}}.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse(req);

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const apiKey = Deno.env.get("ATICKET_API_KEY");
    const apiUrl = Deno.env.get("ATICKET_API_URL");

    if (!apiKey || !apiUrl) {
      return new Response(
        JSON.stringify({ error: "WhatsApp API not configured. Set ATICKET_API_KEY and ATICKET_API_URL." }),
        { status: 500, headers }
      );
    }

    const { phone, template, variables } = (await req.json()) as WhatsAppRequest;

    if (!phone || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phone, template" }),
        { status: 400, headers }
      );
    }

    const templateText = TEMPLATES[template];
    if (!templateText) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers }
      );
    }

    // Replace variables in template
    let message = templateText;
    for (const [key, value] of Object.entries(variables || {})) {
      message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }

    // Clean phone number (Brazil format)
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    // Send via A-Ticket API
    const response = await fetch(`${apiUrl}/messages/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message,
        type: "text",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("A-Ticket API error:", errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to send WhatsApp message", details: errorBody }),
        { status: response.status, headers }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id, template, phone: formattedPhone }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("WhatsApp notification error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers }
    );
  }
});

import { safeFetch } from "../_shared/safeFetch.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withCircuitBreaker } from "../_shared/circuitBreaker.ts";
import { log } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let action: string | undefined;
  try {
    const rl = await checkRateLimit(req, "evolution-whatsapp", {
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "rate_limited" }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    action = body.action;
    const { data } = body;

    switch (action) {
      case "send_text": {
        const { instance, phone, message } = data;
        if (!instance || !phone || !message) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Campos obrigatórios: instance, phone, message",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const result = await withCircuitBreaker("whatsapp-api", async () => {
          const response = await safeFetch(
            `${EVOLUTION_API_URL}/message/sendText/${instance}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                number: phone.replace(/\D/g, ""),
                text: message,
              }),
            },
          );

          const data = await response.json();
          if (!response.ok) {
            throw new Error(
              `Evolution API error [${response.status}]: ${JSON.stringify(data)}`,
            );
          }
          return data;
        });

        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_cotacao": {
        const {
          instance,
          phone,
          transportadora,
          origem,
          destino,
          peso,
          volumes,
          valor_mercadoria,
        } = data;
        if (!instance || !phone) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Campos obrigatórios: instance, phone",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const message = [
          `📦 *Solicitação de Cotação de Frete*`,
          ``,
          `📍 *Origem:* ${origem || "N/A"}`,
          `📍 *Destino:* ${destino || "N/A"}`,
          `⚖️ *Peso:* ${peso || "N/A"} kg`,
          `📦 *Volumes:* ${volumes || "N/A"}`,
          valor_mercadoria
            ? `💰 *Valor Mercadoria:* R$ ${valor_mercadoria}`
            : "",
          ``,
          `Favor informar *valor* e *prazo de entrega*.`,
          `Obrigado! 🙏`,
        ]
          .filter(Boolean)
          .join("\n");

        const response = await safeFetch(
          `${EVOLUTION_API_URL}/message/sendText/${instance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: phone.replace(/\D/g, ""),
              text: message,
            }),
          },
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            `Evolution API error [${response.status}]: ${JSON.stringify(result)}`,
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: result,
            message_sent: message,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      case "check_status": {
        const { instance } = data;
        const response = await safeFetch(
          `${EVOLUTION_API_URL}/instance/connectionState/${instance}`,
          {
            headers: { apikey: EVOLUTION_API_KEY },
          },
        );

        const result = await response.json();
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Ação desconhecida: ${action}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isCircuitOpen = errorMessage.includes("Circuit Breaker");

    log("ERROR", "Evolution WhatsApp error", { error: errorMessage, action });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        circuitOpen: isCircuitOpen,
      }),
      {
        status: isCircuitOpen ? 503 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

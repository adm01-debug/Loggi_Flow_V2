import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";
import { log } from "../_shared/logger.ts";
import { parseLocaleNumber } from "../_shared/number.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isSecretConfigured } from "../_shared/secretConfig.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json();
    log.info("Normalize Freight call received", {
      body_summary: body.text?.substring(0, 50),
    });

    // Contract Validation — transportadora_id is optional (omitted for new/unsaved carriers)
    const { isValid, errors } = await validateContract(
      supabaseClient,
      "normalize-freight-response",
      body,
      (p) => {
        requireString(p, "text", { minLength: 1 });
        if (p.transportadora_id !== undefined) {
          requireString(p, "transportadora_id", { minLength: 36 }); // UUID when provided
        }
      },
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: "Contract Violation",
          details: errors,
          nexus_protocol: "NORMALIZE_GATE_REJECTION",
        }),
        {
          headers: { ...headers, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const { text, transportadora_id, cotacao_id } = body;

    // 1. Fetch normalization config (skip if no carrier ID, e.g. testing a new carrier)
    let config: Record<string, string> = {};
    if (transportadora_id) {
      const { data: carrier, error: carrierError } = await supabaseClient
        .from("transportadoras")
        .select("non_api_config")
        .eq("id", transportadora_id)
        .single();

      if (carrierError) throw carrierError;
      config = carrier?.non_api_config?.normalization || {};
    }
    let price = null;
    let days = null;

    // 2. Try Regex if defined
    if (config.price_pattern) {
      try {
        const priceRegex = new RegExp(config.price_pattern, "i");
        const priceMatch = text.match(priceRegex);
        if (priceMatch && priceMatch[1]) {
          price = parseLocaleNumber(priceMatch[1]);
        }
      } catch {
        log.warn("Invalid price_pattern regex, skipping", {
          pattern: config.price_pattern,
        });
      }
    }

    if (config.term_pattern) {
      try {
        const termRegex = new RegExp(config.term_pattern, "i");
        const termMatch = text.match(termRegex);
        if (termMatch && termMatch[1]) {
          days = parseInt(termMatch[1]);
        }
      } catch {
        log.warn("Invalid term_pattern regex, skipping", {
          pattern: config.term_pattern,
        });
      }
    }

    // 3. Use AI if fallback is enabled and we are missing data
    if (
      (!price || !days) &&
      isSecretConfigured(Deno.env.get("OPENAI_API_KEY")) &&
      (config.fallback_strategy === "ai_extraction" ||
        config.fallback_strategy === "hybrid")
    ) {
      log.info("Using AI to extract data...");
      const aiResponse = await safeFetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: config.ai_prompt ||
                  'Extract freight price and delivery days from the text. Return JSON: {"price": number, "days": number}',
              },
              { role: "user", content: text },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );

      const aiData = await aiResponse.json();
      const aiContent = aiData?.choices?.[0]?.message?.content;
      if (aiContent) {
        try {
          const extracted = JSON.parse(aiContent);
          price = price ?? extracted.price ?? null;
          days = days ?? extracted.days ?? null;
        } catch {
          log.warn("AI returned non-JSON content", {
            sample: String(aiContent).slice(0, 120),
          });
        }
      }
    }

    // 4. Update the quote if cotacao_id is provided
    if (cotacao_id && (price !== null || days !== null)) {
      await supabaseClient
        .from("cotacoes_multicanal")
        .update({
          valor_cotado: price,
          prazo_dias: days,
          status: "respondido",
          observacoes: `Extraído automaticamente: ${text.substring(0, 100)}...`,
        })
        .eq("id", cotacao_id);
    }

    return new Response(JSON.stringify({ success: true, price, days }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    log.error("Normalization error", { error: error.message });

    // Alert on normalization failure
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabaseClient = createClient(supabaseUrl, supabaseKey);

      const { data: usersToNotify } = await supabaseClient
        .from("user_notification_preferences")
        .select("user_id")
        .eq("notifications_whatsapp", true);

      if (usersToNotify) {
        const userIds = usersToNotify.map((u: any) => u.user_id);
        const { data: settings } = await supabaseClient
          .from("prediction_accuracy_settings")
          .select("user_id, whatsapp_phone")
          .in("user_id", userIds)
          .eq("notify_whatsapp", true);
        const phoneByUser = new Map<string, string>();
        for (const s of settings ?? []) {
          if (s.whatsapp_phone) phoneByUser.set(s.user_id, s.whatsapp_phone);
        }

        let falhas = 0;
        for (const user of usersToNotify) {
          const phone = phoneByUser.get(user.user_id);
          if (!phone) continue;

          const envio = await invokeFunction("whatsapp-notification", {
            action: "send_normalization_alert",
            phone,
            variables: {
              transportadora: "Nexus Engine",
              cotacao_id: "Internal",
            },
          });

          if (!envio.ok) {
            falhas += 1;
            log.warn("Falha ao avisar usuário sobre erro de normalização", {
              userId: user.user_id,
              reason: envio.reason,
            });
          }
        }

        if (falhas > 0) {
          log.warn("Alertas de normalização não entregues", {
            falhas,
            total: usersToNotify.length,
          });
        }
      }
    } catch (alertError) {
      log.error("Failed to send failure alert:", alertError);
    }

    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

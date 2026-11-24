import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";
import { withCircuitBreaker } from "../_shared/circuitBreaker.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { getWeatherForRoutes } from "../_shared/weather.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY")!;

export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { allowed, message } = await checkRateLimit(req, "predict-delays", {
      maxRequests: 10, // Limit to 10 requests per minute
      windowMs: 60 * 1000,
    });

    if (!allowed) {
      log("WARN", "Rate limit exceeded for predict-delays", { message });
      return new Response(
        JSON.stringify({ error: message || "Rate limit exceeded" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Check for recent cached predictions (last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: cachedPredictions } = await supabase
      .from("ai_delay_predictions")
      .select("*")
      .gte("analyzed_at", sixHoursAgo);

    if (cachedPredictions && cachedPredictions.length > 0) {
      log("INFO", "Returning cached predictions", {
        count: cachedPredictions.length,
      });

      const predictions = cachedPredictions.map((p) => ({
        ...p.prediction_data,
        risco: p.risco,
        probabilidade_atraso: p.probabilidade_atraso,
        analyzed_at: p.analyzed_at,
      }));

      const summary = {
        total_analisados: predictions.length,
        criticos: predictions.filter((p: any) => p.risco === "critico").length,
        altos: predictions.filter((p: any) => p.risco === "alto").length,
        medios: predictions.filter((p: any) => p.risco === "medio").length,
        baixos: predictions.filter((p: any) => p.risco === "baixo").length,
      };

      return new Response(
        JSON.stringify({
          success: true,
          predictions,
          summary,
          analyzed_at: cachedPredictions[0].analyzed_at,
          cached: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("INFO", "Starting new delay prediction analysis");

    // Fetch active deliveries
    const { data: entregas, error: entregasError } = await supabase
      .from("entregas")
      .select(
        `
        id,
        numero_entrega,
        endereco_entrega,
        previsao_entrega,
        status,
        created_at,
        data_despacho,
        latitude,
        longitude,
        transportadoras (nome_fantasia)
      `,
      )
      .in("status", ["despachado", "em_transito", "saiu_entrega"])
      .order("previsao_entrega", { ascending: true });

    if (entregasError) throw entregasError;

    // Fetch active pickups
    const { data: coletas, error: coletasError } = await supabase
      .from("coletas")
      .select(
        `
        id,
        numero_coleta,
        endereco_coleta,
        data_prevista_coleta,
        status,
        created_at,
        transportadoras (nome_fantasia)
      `,
      )
      .in("status", ["solicitada", "em_transito"])
      .order("data_prevista_coleta", { ascending: true });

    if (coletasError) throw coletasError;

    // Fetch historical data for pattern analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historicalDeliveries } = await supabase
      .from("entregas")
      .select(
        "status, previsao_entrega, data_entrega_efetiva, endereco_entrega",
      )
      .eq("status", "entregue")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(100);

    const { data: occurrences } = await supabase
      .from("ocorrencias")
      .select("tipo_ocorrencia, entrega_id, coleta_id")
      .gte("created_at", thirtyDaysAgo.toISOString());

    let delayRate = 0;
    if (historicalDeliveries && historicalDeliveries.length > 0) {
      const delayed = historicalDeliveries.filter(
        (d) =>
          d.previsao_entrega &&
          d.data_entrega_efetiva &&
          new Date(d.data_entrega_efetiva) > new Date(d.previsao_entrega),
      ).length;
      delayRate = (delayed / historicalDeliveries.length) * 100;
    }

    const entregasForAnalysis = (entregas || []).map((e: any) => ({
      id: e.id,
      numero: e.numero_entrega,
      endereco: e.endereco_entrega,
      previsao: e.previsao_entrega,
      status: e.status,
      transportadora: e.transportadoras?.nome_fantasia || "N/A",
      latitude: e.latitude ?? null,
      longitude: e.longitude ?? null,
      dias_em_transito: e.data_despacho
        ? Math.floor(
            (Date.now() - new Date(e.data_despacho).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0,
    }));

    const coletasForAnalysis = (coletas || []).map((c: any) => ({
      id: c.id,
      numero: c.numero_coleta,
      endereco: c.endereco_coleta,
      previsao: c.data_prevista_coleta,
      status: c.status,
      transportadora: c.transportadoras?.nome_fantasia || "N/A",
    }));

    const occurrenceStats = {
      total: occurrences?.length || 0,
      tipos:
        occurrences?.reduce((acc: Record<string, number>, o) => {
          acc[o.tipo_ocorrencia] = (acc[o.tipo_ocorrencia] || 0) + 1;
          return acc;
        }, {}) || {},
    };

    // 3.24/3.25 — clima real (OpenWeather) para entregas com coordenadas
    const coords = entregasForAnalysis
      .filter((e: any) => e.latitude && e.longitude)
      .map((e: any) => ({ lat: Number(e.latitude), lon: Number(e.longitude) }));
    const weather = await getWeatherForRoutes(coords);

    const now = new Date();
    const prompt = `Analise os dados logísticos e preveja riscos de atraso:
    DADOS: ${JSON.stringify({
      entregas: entregasForAnalysis,
      coletas: coletasForAnalysis,
      stats: { delayRate: delayRate.toFixed(1), occurrences: occurrenceStats },
      clima: weather.summary,
    })}
    Retorne um JSON array (max 10 itens críticos). Para "fatores", use APENAS estes nomes: "clima", "historico_transportadora", "distancia", "horario", "sazonalidade", "ocorrencias_recentes", "tempo_transito". Peso 0-100, impacto "positivo"|"negativo"|"neutro":
    [{
      "id": "uuid",
      "numero": "string",
      "tipo": "entrega"|"coleta",
      "risco": "baixo"|"medio"|"alto"|"critico",
      "probabilidade_atraso": 0-100,
      "motivos": ["string"],
      "recomendacoes": ["string"],
      "horas_estimadas_atraso": number,
      "fatores": [{"nome": "string", "peso": 0-100, "impacto": "positivo"|"negativo"|"neutro", "descricao": "string"}]
    }]`;

    const aiResponse = await withCircuitBreaker("ai-gateway", async () => {
      const response = await safeFetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          circuitBreakerName: null, // breaker "ai-gateway" ja aplicado no withCircuitBreaker externo
          method: "POST",
          headers: {
            Authorization: `Bearer ${GOOGLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-3.6-flash",
            messages: [
              {
                role: "system",
                content:
                  "Especialista em logística preditiva. Retorne APENAS JSON.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
          }),
        },
      );

      if (!response.ok) throw new Error(`AI Gateway Error: ${response.status}`);
      return await response.json();
    });

    const content = aiResponse.choices?.[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?|```/g, "").trim();
    let predictions: any[] = [];
    try {
      const parsed = JSON.parse(cleanContent);
      predictions = Array.isArray(parsed) ? parsed : [];
    } catch {
      log("WARN", "AI returned non-JSON content for predictions", {
        sample: cleanContent.slice(0, 120),
      });
    }

    // 2. Cache new predictions
    if (predictions.length > 0) {
      const cacheData = predictions.map((p: any) => ({
        entity_id: p.id,
        entity_type: p.tipo,
        risco: p.risco,
        probabilidade_atraso: p.probabilidade_atraso,
        prediction_data: p,
        analyzed_at: now.toISOString(),
      }));

      // Clear predictions older than 6 hours
      const sixHoursAgo = new Date(
        Date.now() - 6 * 60 * 60 * 1000,
      ).toISOString();
      await supabase
        .from("ai_delay_predictions")
        .delete()
        .lt("analyzed_at", sixHoursAgo);

      const { error: cacheError } = await supabase
        .from("ai_delay_predictions")
        .insert(cacheData);
      if (cacheError) log("ERROR", "Failed to cache predictions", cacheError);

      // Sprint P #1: Persist full history for auditability + Sprint P #2 feedback loop
      const historyRows = predictions.map((p: any) => {
        const original =
          p.tipo === "entrega"
            ? entregasForAnalysis.find((e: any) => e.id === p.id)
            : coletasForAnalysis.find((c: any) => c.id === p.id);
        return {
          entity_id: p.id,
          entity_type: p.tipo,
          entity_numero: p.numero,
          transportadora: original?.transportadora ?? null,
          risco: p.risco,
          probabilidade_atraso: Math.max(
            0,
            Math.min(100, Number(p.probabilidade_atraso) || 0),
          ),
          horas_estimadas_atraso: Number(p.horas_estimadas_atraso) || 0,
          motivos: Array.isArray(p.motivos) ? p.motivos : [],
          recomendacoes: Array.isArray(p.recomendacoes) ? p.recomendacoes : [],
          fatores: Array.isArray(p.fatores) ? p.fatores : [],
          predicted_at: now.toISOString(),
        };
      });
      const { error: histError } = await supabase
        .from("delay_predictions_history")
        .insert(historyRows);
      if (histError)
        log("ERROR", "Failed to persist prediction history", histError);
    }

    const summary = {
      total_analisados: entregasForAnalysis.length + coletasForAnalysis.length,
      criticos: predictions.filter((p: any) => p.risco === "critico").length,
      altos: predictions.filter((p: any) => p.risco === "alto").length,
      medios: predictions.filter((p: any) => p.risco === "medio").length,
      baixos: predictions.filter((p: any) => p.risco === "baixo").length,
      taxa_atraso_historica: delayRate,
    };

    // 3. Trigger WhatsApp alerts for Critical risks
    const criticals = predictions.filter((p: any) => p.risco === "critico");
    if (criticals.length > 0) {
      log("INFO", "Triggering WhatsApp alerts for critical delays", {
        count: criticals.length,
      });

      // Fetch users with WhatsApp notifications enabled for SLA
      const { data: usersToNotify } = await supabase
        .from("user_notification_preferences")
        .select("user_id")
        .eq("notifications_whatsapp", true)
        .eq("notifications_sla", true);

      if (usersToNotify && usersToNotify.length > 0) {
        const userIds = usersToNotify.map((u: any) => u.user_id);
        const { data: settings } = await supabase
          .from("prediction_accuracy_settings")
          .select("user_id, whatsapp_phone")
          .in("user_id", userIds)
          .eq("notify_whatsapp", true);
        const phoneByUser = new Map<string, string>();
        for (const s of settings ?? []) {
          if (s.whatsapp_phone) phoneByUser.set(s.user_id, s.whatsapp_phone);
        }

        let falhasAlerta = 0;

        for (const prediction of criticals) {
          const originalItem =
            prediction.tipo === "entrega"
              ? entregasForAnalysis.find((e) => e.id === prediction.id)
              : coletasForAnalysis.find((c) => c.id === prediction.id);

          for (const user of usersToNotify) {
            const phone = phoneByUser.get(user.user_id);
            if (phone) {
              const envio = await invokeFunction("whatsapp-notification", {
                action: "send_delay_alert",
                phone,
                entrega_id:
                  prediction.tipo === "entrega" ? prediction.id : undefined,
                coleta_id:
                  prediction.tipo === "coleta" ? prediction.id : undefined,
                variables: {
                  numero: prediction.numero,
                  transportadora: originalItem?.transportadora || "N/A",
                },
              });

              if (!envio.ok) falhasAlerta += 1;
            }
          }
        }

        if (falhasAlerta > 0) {
          log("WARN", "Delay alerts not delivered", { falhas: falhasAlerta });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        predictions,
        summary,
        analyzed_at: now.toISOString(),
        cached: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    log("ERROR", "Predict-delays failure", { error: error.message });
    return new Response(
      JSON.stringify({ success: false, message: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);

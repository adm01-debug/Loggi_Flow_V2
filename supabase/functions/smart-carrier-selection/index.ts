import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log, LogLevel } from "../_shared/logger.ts";
import { ValidationError, validationErrorResponse } from "../_shared/validate.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";
import { parseSmartSelectionInput } from "./parse.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { estado_destino, peso_kg, urgencia, tipo_carga } =
      parseSmartSelectionInput(body);

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId = null;
    if (authHeader) {
      const {
        data: { user },
      } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id;
    }

    log({
      level: LogLevel.INFO,
      message: "Analizing smart carrier selection request",
      meta: { estado_destino, peso_kg, urgencia, tipo_carga },
      userId,
    });

    // Fetch selection rules
    const { data: selectionRules } = await supabase
      .from("freight_selection_rules")
      .select("*")
      .eq("is_active", true);

    const activeRule = selectionRules?.find(
      (r) => r.event_type?.toLowerCase() === urgencia?.toLowerCase(),
    ) ||
      selectionRules?.find((r) => r.is_default) || {
        price_weight: 0.5,
        time_weight: 0.3,
        performance_weight: 0.2,
        max_sla_days: 15,
        event_type: "Default",
      };

    // Fetch freight tables with carrier info
    const { data: tabelasFrete, error: tabelasError } = await supabase
      .from("tabelas_frete")
      .select(
        `
        *,
        transportadora:transportadoras(
          id, 
          nome_fantasia, 
          score_performance, 
          prazo_medio_dias,
          regioes_atendidas,
          homologada
        )
      `,
      )
      .eq("estado_destino", estado_destino)
      .eq("ativo", true);

    if (tabelasError) {
      log({
        level: LogLevel.ERROR,
        message: "Error fetching freight tables",
        meta: { error: tabelasError.message },
      });
      throw tabelasError;
    }

    // Filter by weight range and homologated carriers
    const matchingTables = (tabelasFrete || []).filter(
      (t: any) =>
        peso_kg >= t.peso_min_kg &&
        peso_kg < t.peso_max_kg &&
        t.transportadora?.homologada,
    );

    if (matchingTables.length === 0) {
      const errorMsg =
        "Nenhuma transportadora disponível para este destino e peso";

      // Log failed decision
      await supabase.from("freight_decisions").insert({
        user_id: userId,
        request_params: { estado_destino, peso_kg, urgencia, tipo_carga },
        recommendations: [],
        rule_applied: activeRule,
        status: "no_options",
        error_message: errorMsg,
      });

      log({
        level: LogLevel.WARN,
        message: errorMsg,
        meta: { estado_destino, peso_kg },
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: errorMsg,
          recommendations: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch historical performance data
    const { data: historicoEntregas } = await supabase
      .from("entregas")
      .select(
        "transportadora_id, status, data_entrega_efetiva, previsao_entrega, valor_frete",
      )
      .not("transportadora_id", "is", null)
      .eq("status", "entregue")
      .order("created_at", { ascending: false })
      .limit(500);

    const carrierMetrics: Record<
      string,
      { onTime: number; total: number; totalCost: number }
    > = {};
    (historicoEntregas || []).forEach((entrega: any) => {
      if (!carrierMetrics[entrega.transportadora_id]) {
        carrierMetrics[entrega.transportadora_id] = {
          onTime: 0,
          total: 0,
          totalCost: 0,
        };
      }
      carrierMetrics[entrega.transportadora_id].total++;
      if (
        entrega.data_entrega_efetiva &&
        entrega.previsao_entrega &&
        new Date(entrega.data_entrega_efetiva) <=
          new Date(entrega.previsao_entrega)
      ) {
        carrierMetrics[entrega.transportadora_id].onTime++;
      }
      if (entrega.valor_frete)
        carrierMetrics[entrega.transportadora_id].totalCost +=
          entrega.valor_frete;
    });

    // Compute price bounds once to avoid O(n²) recomputation inside .map()
    const maxPriceFound = Math.max(
      ...matchingTables.map((t: any) => t.valor_total),
    );
    const minPriceFound = Math.min(
      ...matchingTables.map((t: any) => t.valor_total),
    );
    const priceWeight = parseFloat(activeRule.price_weight);
    const timeWeight = parseFloat(activeRule.time_weight);
    const performanceWeight = parseFloat(activeRule.performance_weight);

    const recommendations = matchingTables
      .map((table: any) => {
        const carrierId = table.transportadora_id;
        const metrics = carrierMetrics[carrierId] || { onTime: 0, total: 0 };
        const onTimeRate =
          metrics.total > 0
            ? (metrics.onTime / metrics.total) * 100
            : table.transportadora.score_performance || 80;
        const priceScore =
          maxPriceFound === minPriceFound
            ? 100
            : ((maxPriceFound - table.valor_total) /
                (maxPriceFound - minPriceFound)) *
              100;
        const timeScore = Math.max(
          0,
          100 - table.transportadora.prazo_medio_dias * 5,
        );
        const perfScore = onTimeRate;

        const score =
          priceScore * priceWeight +
          timeScore * timeWeight +
          perfScore * performanceWeight;
        const meetsSLA = activeRule.max_sla_days
          ? table.transportadora.prazo_medio_dias <= activeRule.max_sla_days
          : true;

        return {
          carrier_id: carrierId,
          carrier_name: table.transportadora.nome_fantasia,
          score: Math.round(score),
          meets_sla: meetsSLA,
          estimated_cost: table.valor_total,
          estimated_days: table.transportadora.prazo_medio_dias,
          reliability: Math.round(onTimeRate),
          details: { priceScore, timeScore, perfScore },
          reason:
            score > 80
              ? `Recomendação TOP para evento ${activeRule.event_type || "Geral"}.`
              : `Opção secundária.`,
        };
      })
      .filter((r: any) => r.meets_sla)
      .sort((a: any, b: any) => b.score - a.score);

    // Log the decision
    if (recommendations.length > 0) {
      await supabase.from("freight_decisions").insert({
        user_id: userId,
        request_params: { estado_destino, peso_kg, urgencia, tipo_carga },
        selected_carrier_id: recommendations[0].carrier_id,
        selected_carrier_name: recommendations[0].carrier_name,
        recommendations: recommendations,
        rule_applied: activeRule,
        status: "success",
      });
    }

    log({
      level: LogLevel.INFO,
      message: "Smart carrier selection completed",
      meta: { carrier_count: recommendations.length },
    });

    return new Response(JSON.stringify({ success: true, recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders);
    }
    log({
      level: LogLevel.ERROR,
      message: "Smart carrier selection function error",
      meta: { error: error.message },
    });
    return internalErrorResponse(error, corsHeaders, "smart-carrier-selection");
  }
});

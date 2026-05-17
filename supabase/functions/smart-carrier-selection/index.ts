import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { estado_destino, peso_kg, urgencia, tipo_carga } = await req.json();
    
    log('INFO', "Analizing smart carrier selection request", { estado_destino, peso_kg, urgencia, tipo_carga });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch selection rules
    const { data: selectionRules } = await supabase
      .from("freight_selection_rules")
      .select("*")
      .eq("is_active", true);

    const activeRule = selectionRules?.find(r => r.event_type === (urgencia === 'alta' ? 'Urgente' : 'Normal')) 
                    || selectionRules?.find(r => r.is_default) 
                    || { price_weight: 0.5, time_weight: 0.3, performance_weight: 0.2, max_sla_days: 15 };

    // Fetch freight tables with carrier info
    const { data: tabelasFrete, error: tabelasError } = await supabase
      .from("tabelas_frete")
      .select(`
        *,
        transportadora:transportadoras(
          id, 
          nome_fantasia, 
          score_performance, 
          prazo_medio_dias,
          regioes_atendidas,
          homologada
        )
      `)
      .eq("estado_destino", estado_destino)
      .eq("ativo", true);

    if (tabelasError) {
      log('ERROR', "Error fetching freight tables", { error: tabelasError.message });
      throw tabelasError;
    }

    // Filter by weight range and homologated carriers
    const matchingTables = (tabelasFrete || []).filter(
      (t: any) =>
        peso_kg >= t.peso_min_kg &&
        peso_kg < t.peso_max_kg &&
        t.transportadora?.homologada
    );

    if (matchingTables.length === 0) {
      log('WARN', "No carriers available for this destination and weight", { estado_destino, peso_kg });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Nenhuma transportadora disponível para este destino e peso",
          recommendations: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch historical performance data
    const { data: historicoEntregas } = await supabase
      .from("entregas")
      .select("transportadora_id, status, data_entrega_efetiva, previsao_entrega, valor_frete")
      .not("transportadora_id", "is", null)
      .eq("status", "entregue")
      .order("created_at", { ascending: false })
      .limit(500);

    // Calculate historical metrics per carrier
    const carrierMetrics: Record<string, { onTime: number; total: number; avgCost: number; totalCost: number }> = {};
    
    (historicoEntregas || []).forEach((entrega: any) => {
      if (!carrierMetrics[entrega.transportadora_id]) {
        carrierMetrics[entrega.transportadora_id] = { onTime: 0, total: 0, avgCost: 0, totalCost: 0 };
      }
      carrierMetrics[entrega.transportadora_id].total++;
      
      if (entrega.data_entrega_efetiva && entrega.previsao_entrega) {
        const efetiva = new Date(entrega.data_entrega_efetiva);
        const prevista = new Date(entrega.previsao_entrega);
        if (efetiva <= prevista) {
          carrierMetrics[entrega.transportadora_id].onTime++;
        }
      }
      
      if (entrega.valor_frete) {
        carrierMetrics[entrega.transportadora_id].totalCost += entrega.valor_frete;
      }
    });

    // Calculate recommendations
    const recommendations = matchingTables.map((table: any) => {
      const carrierId = table.transportadora_id;
      const metrics = carrierMetrics[carrierId] || { onTime: 0, total: 0, avgCost: 0 };
      
      const onTimeRate = metrics.total > 0 ? (metrics.onTime / metrics.total) * 100 : 80;
      const costWeight = urgencia === 'alta' ? 0.3 : 0.7;
      const performanceWeight = 1 - costWeight;

      // Simple scoring: 0-100
      const costScore = Math.max(0, 100 - (table.valor_total / 10)); // Arbitrary normalization
      const score = (costScore * costWeight) + (onTimeRate * performanceWeight);

      return {
        carrier_id: carrierId,
        carrier_name: table.transportadora.nome_fantasia,
        score: Math.round(score),
        estimated_cost: table.valor_total,
        estimated_days: table.transportadora.prazo_medio_dias,
        reliability: Math.round(onTimeRate),
        reason: urgencia === 'alta' 
          ? `Melhor pontualidade histórica (${Math.round(onTimeRate)}%) para entregas urgentes.`
          : `Melhor custo-benefício (R$ ${table.valor_total}) para o trecho.`
      };
    }).sort((a: any, b: any) => b.score - a.score);

    log('INFO', "Smart carrier selection completed", { carrier_count: recommendations.length });

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    log('ERROR', "Smart carrier selection function error", { error: error.message });
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

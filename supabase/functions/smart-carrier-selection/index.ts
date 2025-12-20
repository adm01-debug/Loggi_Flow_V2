import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { estado_destino, peso_kg, urgencia, tipo_carga } = await req.json();
    
    console.log("[smart-carrier-selection] Analyzing request:", { estado_destino, peso_kg, urgencia, tipo_carga });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      console.error("[smart-carrier-selection] Error fetching freight tables:", tabelasError);
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

    // Calculate averages
    Object.keys(carrierMetrics).forEach((id) => {
      const m = carrierMetrics[id];
      m.avgCost = m.total > 0 ? m.totalCost / m.total : 0;
    });

    // Prepare carrier data for AI analysis
    const carrierData = matchingTables.map((t: any) => {
      const metrics = carrierMetrics[t.transportadora_id] || { onTime: 0, total: 0, avgCost: 0 };
      const onTimeRate = metrics.total > 0 ? (metrics.onTime / metrics.total) * 100 : null;
      const valorTotal = t.taxa_fixa + (t.preco_por_kg * peso_kg);
      
      return {
        id: t.transportadora_id,
        nome: t.transportadora?.nome_fantasia,
        scorePerformance: t.transportadora?.score_performance || 0,
        prazoDias: t.prazo_dias,
        valorTotal,
        precoPorKg: t.preco_por_kg,
        taxaFixa: t.taxa_fixa,
        onTimeRate,
        totalEntregas: metrics.total,
        regiao: t.regiao_destino,
      };
    });

    // Call Lovable AI for intelligent recommendation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[smart-carrier-selection] LOVABLE_API_KEY not configured");
      // Fallback to simple algorithm
      const sorted = carrierData.sort((a: any, b: any) => {
        const scoreA = (a.scorePerformance * 0.3) + ((a.onTimeRate || 50) * 0.3) + ((1 / a.valorTotal) * 10000 * 0.2) + ((1 / a.prazoDias) * 10 * 0.2);
        const scoreB = (b.scorePerformance * 0.3) + ((b.onTimeRate || 50) * 0.3) + ((1 / b.valorTotal) * 10000 * 0.2) + ((1 / b.prazoDias) * 10 * 0.2);
        return scoreB - scoreA;
      });

      return new Response(
        JSON.stringify({
          success: true,
          recommendations: sorted.slice(0, 3).map((c: any, i: number) => ({
            ...c,
            rank: i + 1,
            aiReason: i === 0 ? "Melhor equilíbrio entre custo, prazo e performance" : 
                      i === 1 ? "Boa alternativa com performance consistente" :
                      "Opção econômica viável",
            confidence: 75 - (i * 10),
          })),
          analysisType: "algorithmic",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Você é um especialista em logística. Analise as transportadoras abaixo e recomende as 3 melhores opções para uma entrega.

CONTEXTO:
- Destino: ${estado_destino}
- Peso: ${peso_kg}kg
- Urgência: ${urgencia || "normal"}
- Tipo de carga: ${tipo_carga || "geral"}

TRANSPORTADORAS DISPONÍVEIS:
${carrierData.map((c: any) => `
- ${c.nome}:
  * Score de performance: ${c.scorePerformance}/100
  * Prazo: ${c.prazoDias} dias
  * Valor total: R$ ${c.valorTotal.toFixed(2)}
  * Taxa on-time: ${c.onTimeRate ? c.onTimeRate.toFixed(1) + "%" : "Sem histórico"}
  * Entregas realizadas: ${c.totalEntregas}
`).join("")}

Responda em JSON com este formato exato:
{
  "recommendations": [
    {
      "id": "id_da_transportadora",
      "rank": 1,
      "reason": "Explicação clara e objetiva do porquê",
      "confidence": 85
    }
  ],
  "generalAnalysis": "Breve análise geral da situação"
}`;

    console.log("[smart-carrier-selection] Calling Lovable AI...");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em logística e seleção de transportadoras. Responda sempre em JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("[smart-carrier-selection] AI API error:", aiResponse.status);
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("[smart-carrier-selection] AI response:", aiContent);

    // Parse AI response
    let aiRecommendations: { recommendations?: { id: string; rank: number; reason: string; confidence: number }[]; generalAnalysis?: string } | undefined;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiRecommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("[smart-carrier-selection] Error parsing AI response:", parseError);
    }

    // Merge AI recommendations with carrier data
    const finalRecommendations = carrierData
      .map((c: any) => {
        const aiRec = aiRecommendations?.recommendations?.find((r: any) => r.id === c.id);
        return {
          ...c,
          rank: aiRec?.rank || 99,
          aiReason: aiRec?.reason || "Análise automática",
          confidence: aiRec?.confidence || 50,
        };
      })
      .sort((a: any, b: any) => a.rank - b.rank)
      .slice(0, 3);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: finalRecommendations,
        generalAnalysis: aiRecommendations?.generalAnalysis || "Análise concluída com sucesso",
        analysisType: "ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[smart-carrier-selection] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

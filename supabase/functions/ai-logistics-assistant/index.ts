import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { log } from "../_shared/logger.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { getWeatherForRoutes } from "../_shared/weather.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { ValidationError } from "../_shared/validate.ts";
import { parseAssistantRequest } from "./parse.ts";

// Type definitions for contextual data
interface Transportadora {
  id: string;
  nome_fantasia: string;
  score_performance: number;
  homologada: boolean;
}

interface Entrega {
  id: string;
  status: string;
  previsao_entrega: string | null;
  endereco_entrega: string;
  transportadoras:
    { nome_fantasia: string } | { nome_fantasia: string }[] | null;
  valor_frete?: number;
  created_at?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface Ocorrencia {
  tipo_ocorrencia: string;
  resolvida: boolean | null;
}

export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { allowed } = await checkRateLimit(req, "ai-logistics-assistant", {
      maxRequests: 30,
    });
    if (!allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Muitas solicitações. Tente novamente em alguns minutos.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ success: false, message: "Não autorizado." }),
        {
          status: auth.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    // O usuário é identificado pelas claims do JWT, nunca por um campo do body.
    const userId = auth.claims.sub;

    const body = await req.json();
    const { message, conversationHistory, stream } = parseAssistantRequest(body);

    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    if (!googleApiKey) throw new Error("GOOGLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch rich contextual data for Elite analysis
    const [
      resTransportadoras,
      resEntregasAtivas,
      resCustosRecentes,
      resOcorrenciasAbertas,
      resSlaStats,
    ] = await Promise.all([
      supabase
        .from("transportadoras")
        .select("id, nome_fantasia, score_performance, homologada")
        .eq("homologada", true)
        .order("score_performance", { ascending: false })
        .limit(10),
      supabase
        .from("entregas")
        .select(
          "id, status, previsao_entrega, endereco_entrega, latitude, longitude, transportadoras(nome_fantasia)",
        )
        .in("status", ["despachado", "em_transito", "saiu_entrega"])
        .limit(50),
      supabase
        .from("entregas")
        .select("valor_frete, created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      supabase
        .from("ocorrencias")
        .select("tipo_ocorrencia, resolvida")
        .eq("resolvida", false),
      supabase.rpc("get_carrier_performance_stats"),
    ]);

    const transportadoras = (resTransportadoras.data as Transportadora[]) || [];
    const entregasAtivas = (resEntregasAtivas.data as Entrega[]) || [];
    const custosRecentes = (resCustosRecentes.data as Entrega[]) || [];
    const ocorrenciasAbertas =
      (resOcorrenciasAbertas.data as Ocorrencia[]) || [];
    const slaError = resSlaStats.error;

    if (slaError) {
      log.warn("Aviso: Falha ao carregar estatísticas de performance via RPC.");
    }

    // Manual SLA calc fallback
    const totalFrete = custosRecentes.reduce(
      (acc: number, curr: Entrega) => acc + (Number(curr.valor_frete) || 0),
      0,
    );
    const now = new Date();
    const emAtraso = entregasAtivas.filter(
      (e: Entrega) => e.previsao_entrega && new Date(e.previsao_entrega) < now,
    ).length;

    // 3.24 — contexto externo real (clima) via OpenWeather para as entregas ativas.
    // Query inclui latitude/longitude para alimentar rotas com coordenadas.
    let contextAmbiental: {
      clima: string;
      trafego: string;
      data_analise: string;
      pontos_analisados?: number;
    } = {
      clima: "Não avaliado no momento",
      trafego: "Não avaliado no momento",
      data_analise: now.toLocaleString("pt-BR"),
    };

    if (entregasAtivas.length > 0) {
      const coords = entregasAtivas
        .filter((e) => e.latitude && e.longitude)
        .map((e) => ({
          lat: Number(e.latitude),
          lon: Number(e.longitude),
        }));
      const weather = await getWeatherForRoutes(coords);
      contextAmbiental = {
        clima: weather.summary,
        trafego: "Não avaliado no momento",
        data_analise: now.toLocaleString("pt-BR"),
        pontos_analisados: weather.analyzedCount,
      };
    }

    const systemPrompt = `Você é o LOGI-GPT v5.0, o Assistente Logístico de Elite da LogiFlow. 
    Seu objetivo é fornecer INSIGHTS PROATIVOS e PREVISÕES DE ATRASO com precisão cirúrgica.

    DADOS OPERACIONAIS EM TEMPO REAL:
    - Entregas em Trânsito: ${entregasAtivas.length}
    - Entregas com Risco de Atraso (Previsão Vencida): ${emAtraso}
    - Ocorrências Abertas: ${ocorrenciasAbertas.length}
    - Custo Logístico (30 dias): R$ ${totalFrete.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}
    - Top Transportadoras (Performance): ${transportadoras
      .slice(0, 3)
      .map((t: Transportadora) => t.nome_fantasia)
      .join(", ")}

    CONTEXTO EXTERNO:
    - Clima: ${contextAmbiental.clima}
    - Tráfego: ${contextAmbiental.trafego}

    SUAS DIRETRIZES:
    1. PROATIVIDADE: Não apenas responda, sugira. Se vir muitos atrasos, sugira trocar a transportadora X pela Y para a região Z.
    2. PREVISÃO: Use o contexto climático/tráfego para alertar sobre possíveis atrasos em rotas específicas.
    3. FINANCEIRO: Identifique oportunidades de economia (ex: "O custo médio com a Rodonaves subiu 15%, considere a Lalamove para entregas urbanas").
    4. TOM DE VOZ: Executivo, direto, analítico e confiante. Use emojis estratégicos (🚨, 📊, ⚡, 📉).
    5. FORMATO: Use Markdown rico (tabelas, negrito, listas).

    Analise o contexto e a pergunta do usuário para dar a melhor recomendação logística possível.`;

    const response = await safeFetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-10),
            { role: "user", content: message },
          ],
          temperature: 0.2,
          stream,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Erro no gateway de IA: ${response.status}`);
    }
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const assistantMessage =
      data.choices?.[0]?.message?.content ||
      "Erro ao gerar insight estratégico.";

    return new Response(
      JSON.stringify({ success: true, message: assistantMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message,
          field: error.field,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log.error("Erro no Assistente IA:", { error: String(error) });
    return new Response(
      JSON.stringify({
        success: false,
        message: "Erro de processamento na inteligência logística.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);

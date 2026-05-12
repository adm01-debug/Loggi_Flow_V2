import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const message = body.message || body.prompt;
    const userId = body.userId;
    const conversationHistory = body.conversationHistory || [];
    const stream = body.stream || false;

    if (!message) {
      return new Response(JSON.stringify({ success: false, message: "Por favor, envie uma mensagem." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) throw new Error("API key not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch rich contextual data for Elite analysis
    const [
      { data: transportadoras },
      { data: entregasAtivas },
      { data: custosRecentes },
      { data: ocorrenciasAbertas },
      { data: slaStats }
    ] = await Promise.all([
      supabase.from('transportadoras').select('id, nome_fantasia, score_performance, score_frete, score_pontualidade, homologada').eq('homologada', true).order('score_performance', { ascending: false }).limit(10),
      supabase.from('entregas').select('id, status, previsao_entrega, endereco_entrega, transportadoras(nome_fantasia)').in('status', ['despachado', 'em_transito', 'saiu_entrega']).limit(50),
      supabase.from('entregas').select('valor_frete, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('ocorrencias').select('tipo_ocorrencia, gravidade, status').eq('status', 'aberta'),
      supabase.rpc('get_carrier_performance_stats') // Assume this exists or fallback to manual calc
    ]);

    // Manual SLA calc fallback
    const totalFrete = custosRecentes?.reduce((acc, curr) => acc + (Number(curr.valor_frete) || 0), 0) || 0;
    const now = new Date();
    const emAtraso = entregasAtivas?.filter(e => e.previsao_entrega && new Date(e.previsao_entrega) < now).length || 0;
    
    // Simulate "Traffic/Weather" context (In a real app, this would come from an API)
    const contextAmbiental = {
      clima: "Instável na região Sul (risco de lentidão na BR-101)",
      trafego: "Alto fluxo nas saídas de Curitiba e São Paulo devido a obras",
      data_analise: now.toLocaleString('pt-BR')
    };

    const systemPrompt = `Você é o LOGI-GPT v5.0, o Assistente Logístico de Elite da LogiFlow. 
    Seu objetivo é fornecer INSIGHTS PROATIVOS e PREVISÕES DE ATRASO com precisão cirúrgica.

    DADOS OPERACIONAIS EM TEMPO REAL:
    - Entregas em Trânsito: ${entregasAtivas?.length || 0}
    - Entregas com Risco de Atraso (Previsão Vencida): ${emAtraso}
    - Ocorrências Críticas Abertas: ${ocorrenciasAbertas?.filter(o => o.gravidade === 'alta').length || 0}
    - Custo Logístico (30 dias): R$ ${totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    - Top Transportadoras (Performance): ${transportadoras?.slice(0,3).map(t => t.nome_fantasia).join(', ')}

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt }, 
          ...conversationHistory.slice(-10), 
          { role: "user", content: message }
        ],
        temperature: 0.2,
        stream,
      }),
    });

    if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
    if (stream) return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Erro ao gerar insight estratégico.";

    return new Response(JSON.stringify({ success: true, message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no Assistente IA:", error);
    return new Response(JSON.stringify({ success: false, message: "Erro de processamento na inteligência logística." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
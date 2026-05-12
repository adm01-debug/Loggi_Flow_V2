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

    // Fetch rich contextual data
    const [
      { data: transportadoras },
      { data: rotas },
      { data: entregas },
      { data: coletas },
      { data: conciliacao }
    ] = await Promise.all([
      supabase.from('transportadoras').select('id, nome_fantasia, razao_social, score_performance, homologada, regioes_atendidas').eq('homologada', true).limit(50),
      supabase.from('transportadora_rotas').select('*, transportadora:transportadoras(nome_fantasia)').eq('ativo', true).limit(100),
      supabase.from('entregas').select('id, numero_entrega, status, previsao_entrega, data_entrega_efetiva, valor_frete, endereco_entrega, cliente:clientes(razao_social)').order('created_at', { ascending: false }).limit(50),
      supabase.from('coletas').select('id, numero_coleta, status, data_prevista_coleta, data_efetiva_coleta').order('created_at', { ascending: false }).limit(30),
      supabase.from('conciliacao_financeira').select('valor_faturado, valor_cotado, status_conciliacao').limit(100)
    ]);

    const transportadorasContext = transportadoras?.map(t => `- ${t.nome_fantasia} (Score: ${t.score_performance})`).join('\n') || 'Nenhuma';
    
    // Calculate total cost and potential savings
    const totalFrete = entregas?.reduce((acc, curr) => acc + (Number(curr.valor_frete) || 0), 0) || 0;
    const divergencias = conciliacao?.filter(c => c.status_conciliacao === 'divergente').length || 0;
    
    const now = new Date();
    const entregasAtrasadas = entregas?.filter(e => e.previsao_entrega && !e.data_entrega_efetiva && new Date(e.previsao_entrega) < now && ['aguardando_producao', 'pronto_despacho', 'despachado', 'em_transito', 'saiu_entrega'].includes(e.status)) || [];
    
    const systemPrompt = `Você é o Cérebro Estratégico Logístico da LogiFlow. 
    ESTADO OPERACIONAL:
    - Transportadoras: ${transportadorasContext}
    - Entregas Atrasadas: ${entregasAtrasadas.length}
    - Custo Total Recente de Frete: R$ ${totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    - Divergências de Conciliação: ${divergencias} casos detectados.
    
    INSTRUÇÕES DE ELITE:
    1. Responda de forma analítica, proativa e executiva.
    2. Se houver divergências financeiras, sugira revisar as tabelas de frete das transportadoras envolvidas.
    3. Se o custo de frete estiver subindo, sugira consolidação de carga para as regiões com maior volume.
    4. Analise o Score de performance: não recomende transportadoras com score < 75.
    5. Formate moedas (R$ X.XXX,XX) e use emojis táticos (⚠️, 📈, ✅).
    6. Seja breve mas denso em insights.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: systemPrompt }, ...conversationHistory.slice(-10), { role: "user", content: message }],
        stream,
      }),
    });

    if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
    if (stream) return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Erro ao gerar insight.";

    return new Response(JSON.stringify({ success: true, message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Erro de processamento na IA de elite." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

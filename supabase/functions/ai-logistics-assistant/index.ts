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
      return new Response(JSON.stringify({ 
        success: false,
        error: "Message is required",
        message: "Por favor, envie uma mensagem."
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("API key not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch relevant context from database
    const [
      { data: transportadoras },
      { data: rotas },
      { data: entregas },
      { data: coletas },
    ] = await Promise.all([
      supabase.from('transportadoras').select('id, nome_fantasia, razao_social, score_performance, homologada, regioes_atendidas').eq('homologada', true).limit(50),
      supabase.from('transportadora_rotas').select('*, transportadora:transportadoras(nome_fantasia)').eq('ativo', true).limit(100),
      supabase.from('entregas').select('id, numero_entrega, status, endereco_entrega, previsao_entrega, data_entrega_efetiva, cliente:clientes(razao_social)').order('created_at', { ascending: false }).limit(50),
      supabase.from('coletas').select('id, numero_coleta, status, endereco_coleta, data_prevista_coleta, data_efetiva_coleta').order('created_at', { ascending: false }).limit(30),
    ]);

    // Build context for the AI
    const transportadorasContext = transportadoras?.map(t => 
      `- ${t.nome_fantasia} (Score: ${t.score_performance}, Regiões: ${t.regioes_atendidas?.join(', ') || 'N/A'})`
    ).join('\n') || 'Nenhuma transportadora cadastrada';

    const rotasContext = rotas?.map(r => 
      `- ${(r.transportadora as any)?.nome_fantasia}: ${r.origem_cidade || r.origem_estado} → ${r.destino_cidade || r.destino_estado} (${r.prazo_dias} dias, R$${r.taxa_fixa} + R$${r.preco_por_kg}/kg)`
    ).join('\n') || 'Nenhuma rota cadastrada';

    const now = new Date();
    
    // Identify delayed deliveries
    const entregasAtrasadas = entregas?.filter(e => {
      if (!e.previsao_entrega || e.data_entrega_efetiva) return false;
      const previsao = new Date(e.previsao_entrega);
      const statusEmAberto = ['aguardando_producao', 'pronto_despacho', 'despachado', 'em_transito', 'saiu_entrega'].includes(e.status);
      return statusEmAberto && previsao < now;
    }) || [];

    const entregasContext = entregas?.map(e => {
      const previsao = e.previsao_entrega ? new Date(e.previsao_entrega) : null;
      const atrasada = previsao && !e.data_entrega_efetiva && previsao < now && 
        ['aguardando_producao', 'pronto_despacho', 'despachado', 'em_transito', 'saiu_entrega'].includes(e.status);
      const previsaoStr = previsao ? previsao.toLocaleDateString('pt-BR') : 'N/A';
      return `- ${e.numero_entrega}: ${e.status} | Previsão: ${previsaoStr} | Cliente: ${(e.cliente as any)?.razao_social || 'N/A'}${atrasada ? ' ⚠️ ATRASADA' : ''}`;
    }).join('\n') || 'Nenhuma entrega recente';

    const coletasAtrasadas = coletas?.filter(c => {
      if (!c.data_prevista_coleta || c.data_efetiva_coleta) return false;
      const prevista = new Date(c.data_prevista_coleta);
      const statusEmAberto = ['solicitada', 'agendada', 'em_transito'].includes(c.status);
      return statusEmAberto && prevista < now;
    }) || [];

    const coletasContext = coletas?.map(c => {
      const prevista = c.data_prevista_coleta ? new Date(c.data_prevista_coleta) : null;
      const atrasada = prevista && !c.data_efetiva_coleta && prevista < now &&
        ['solicitada', 'agendada', 'em_transito'].includes(c.status);
      const previstaStr = prevista ? prevista.toLocaleDateString('pt-BR') : 'N/A';
      return `- ${c.numero_coleta}: ${c.status} | Prevista: ${previstaStr}${atrasada ? ' ⚠️ ATRASADA' : ''}`;
    }).join('\n') || 'Nenhuma coleta recente';

    const systemPrompt = `Você é um assistente de logística especializado. Você ajuda usuários a:
- Encontrar transportadoras que atendem rotas específicas
- Analisar custos e prazos de frete
- Acompanhar entregas e coletas
- Tomar decisões sobre logística

DADOS DO SISTEMA:

**Transportadoras Homologadas:**
${transportadorasContext}

**Rotas Disponíveis:**
${rotasContext}

**Entregas Recentes:**
${entregasContext}

**RESUMO DE ATRASOS:**
- Entregas atrasadas: ${entregasAtrasadas.length}
- Coletas atrasadas: ${coletasAtrasadas.length}

**Coletas Recentes:**
${coletasContext}

INSTRUÇÕES:
1. Responda sempre em português brasileiro
2. Seja objetivo e forneça dados concretos quando disponíveis
3. Se perguntado sobre rotas, busque nas rotas disponíveis
4. Recomende transportadoras baseado no score de performance
5. Se não encontrar dados específicos, sugira como o usuário pode cadastrar
6. Para buscas de rotas: mencione origem, destino, prazo e preço
7. Formate valores monetários como R$ X.XXX,XX
8. Quando perguntado sobre entregas/coletas atrasadas, liste todas que estão marcadas com ⚠️ ATRASADA
9. Dê atenção especial aos atrasos e sugira ações quando apropriado`;

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: message }
    ];

    console.log(`[AI Assistant] Processing message for user ${userId}: "${message.substring(0, 100)}..." (stream: ${stream})`);

    // Call Lovable AI with streaming support
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Assistant] Gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded",
          message: "Muitas requisições. Por favor, aguarde alguns segundos."
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required",
          message: "Créditos de IA esgotados. Contate o administrador."
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // If streaming, pass through the stream directly
    if (stream) {
      console.log(`[AI Assistant] Streaming response`);
      
      // Save user message to chat history
      if (userId) {
        await supabase.from('ai_chat_messages').insert([
          { user_id: userId, role: 'user', content: message }
        ]);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";

    console.log(`[AI Assistant] Response generated successfully`);

    // Save messages to chat history if userId provided
    if (userId) {
      await supabase.from('ai_chat_messages').insert([
        { user_id: userId, role: 'user', content: message },
        { user_id: userId, role: 'assistant', content: assistantMessage }
      ]);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: assistantMessage,
      context: {
        transportadorasCount: transportadoras?.length || 0,
        rotasCount: rotas?.length || 0,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[AI Assistant] Error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";

export const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    log('INFO', 'Iniciando predição de atrasos');

    // Fetch active deliveries
    const { data: entregas, error: entregasError } = await supabase
      .from('entregas')
      .select(`
        id,
        numero_entrega,
        endereco_entrega,
        previsao_entrega,
        status,
        created_at,
        data_despacho,
        transportadoras (nome_fantasia)
      `)
      .in('status', ['despachado', 'em_transito', 'saiu_entrega'])
      .order('previsao_entrega', { ascending: true });

    if (entregasError) throw entregasError;

    // Fetch active pickups
    const { data: coletas, error: coletasError } = await supabase
      .from('coletas')
      .select(`
        id,
        numero_coleta,
        endereco_coleta,
        data_prevista_coleta,
        status,
        created_at,
        transportadoras (nome_fantasia)
      `)
      .in('status', ['solicitada', 'em_transito'])
      .order('data_prevista_coleta', { ascending: true });

    if (coletasError) throw coletasError;

    // Fetch historical data for pattern analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historicalDeliveries } = await supabase
      .from('entregas')
      .select('status, previsao_entrega, data_entrega_efetiva, endereco_entrega')
      .eq('status', 'entregue')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(100);

    const { data: occurrences } = await supabase
      .from('ocorrencias')
      .select('tipo_ocorrencia, entrega_id, coleta_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    let delayRate = 0;
    if (historicalDeliveries && historicalDeliveries.length > 0) {
      const delayed = historicalDeliveries.filter(d => 
        d.previsao_entrega && d.data_entrega_efetiva && 
        new Date(d.data_entrega_efetiva) > new Date(d.previsao_entrega)
      ).length;
      delayRate = (delayed / historicalDeliveries.length) * 100;
    }

    const entregasForAnalysis = (entregas || []).map((e: any) => ({
      id: e.id,
      numero: e.numero_entrega,
      endereco: e.endereco_entrega,
      previsao: e.previsao_entrega,
      status: e.status,
      transportadora: e.transportadoras?.nome_fantasia || 'N/A',
      dias_em_transito: e.data_despacho 
        ? Math.floor((Date.now() - new Date(e.data_despacho).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));

    const coletasForAnalysis = (coletas || []).map((c: any) => ({
      id: c.id,
      numero: c.numero_coleta,
      endereco: c.endereco_coleta,
      previsao: c.data_prevista_coleta,
      status: c.status,
      transportadora: c.transportadoras?.nome_fantasia || 'N/A',
    }));

    const occurrenceStats = {
      total: occurrences?.length || 0,
      tipos: occurrences?.reduce((acc: Record<string, number>, o) => {
        acc[o.tipo_ocorrencia] = (acc[o.tipo_ocorrencia] || 0) + 1;
        return acc;
      }, {}) || {},
    };

    const now = new Date();
    const prompt = `Você é um sistema de análise preditiva de logística. Analise os dados abaixo e preveja quais entregas/coletas têm maior probabilidade de atraso.

DADOS ATUAIS (${now.toISOString()}):

ENTREGAS EM ANDAMENTO:
${JSON.stringify(entregasForAnalysis, null, 2)}

COLETAS EM ANDAMENTO:
${JSON.stringify(coletasForAnalysis, null, 2)}

ESTATÍSTICAS HISTÓRICAS (últimos 30 dias):
- Taxa de atraso histórica: ${delayRate.toFixed(1)}%
- Ocorrências registradas: ${JSON.stringify(occurrenceStats)}

REGRAS DE ANÁLISE:
1. Entregas com previsão para hoje ou vencidas são CRÍTICAS
2. Entregas há mais de 3 dias em trânsito têm risco ALTO
3. Endereços em regiões distantes aumentam o risco
4. Histórico de ocorrências da transportadora aumenta o risco
5. Coletas pendentes há mais de 2 dias têm risco MÉDIO

Retorne um JSON array com as previsões (máximo 10 itens mais críticos):
[{
  "id": "uuid",
  "numero": "numero_entrega_ou_coleta",
  "tipo": "entrega" ou "coleta",
  "risco": "baixo" | "medio" | "alto" | "critico",
  "probabilidade_atraso": 0-100,
  "motivos": ["motivo1", "motivo2"],
  "recomendacoes": ["acao1", "acao2"],
  "horas_estimadas_atraso": numero
}]

Retorne APENAS o JSON, sem markdown ou explicações.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em logística que analisa dados e prevê atrasos. Sempre responda em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI Gateway error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    let predictions = [];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      predictions = JSON.parse(cleanContent);
    } catch (e) {
      log('ERROR', 'Falha ao parsear resposta da IA', { content });
    }

    const summary = {
      total_analisados: entregasForAnalysis.length + coletasForAnalysis.length,
      criticos: predictions.filter((p: any) => p.risco === 'critico').length,
      altos: predictions.filter((p: any) => p.risco === 'alto').length,
      medios: predictions.filter((p: any) => p.risco === 'medio').length,
      baixos: predictions.filter((p: any) => p.risco === 'baixo').length,
      taxa_atraso_historica: delayRate,
    };

    return new Response(JSON.stringify({ success: true, predictions, summary, analyzed_at: now.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    log('ERROR', 'Falha na predição de atrasos', { error: error.message });
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);

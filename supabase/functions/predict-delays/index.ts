import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EntregaData {
  id: string;
  numero_entrega: string;
  endereco_entrega: string;
  previsao_entrega: string | null;
  status: string;
  transportadora_nome: string | null;
  created_at: string;
  data_despacho: string | null;
}

interface ColetaData {
  id: string;
  numero_coleta: string;
  endereco_coleta: string;
  data_prevista_coleta: string | null;
  status: string;
  transportadora_nome: string | null;
  created_at: string;
}

interface PredictionResult {
  id: string;
  numero: string;
  tipo: 'entrega' | 'coleta';
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  probabilidade_atraso: number;
  motivos: string[];
  recomendacoes: string[];
  horas_estimadas_atraso: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Buscando entregas e coletas em andamento...');

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

    if (entregasError) {
      console.error('Erro ao buscar entregas:', entregasError);
      throw entregasError;
    }

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

    if (coletasError) {
      console.error('Erro ao buscar coletas:', coletasError);
      throw coletasError;
    }

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

    // Calculate historical delay rate
    let delayRate = 0;
    if (historicalDeliveries && historicalDeliveries.length > 0) {
      const delayed = historicalDeliveries.filter(d => 
        d.previsao_entrega && d.data_entrega_efetiva && 
        new Date(d.data_entrega_efetiva) > new Date(d.previsao_entrega)
      ).length;
      delayRate = (delayed / historicalDeliveries.length) * 100;
    }

    // Prepare context for AI analysis
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

    console.log('Enviando para análise de IA...');

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

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    console.log('Resposta da IA:', content);

    // Parse AI response
    let predictions: PredictionResult[] = [];
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      predictions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      // Fallback: create basic predictions based on rules
      predictions = entregasForAnalysis
        .filter((e: any) => {
          if (!e.previsao) return false;
          const previsao = new Date(e.previsao);
          return previsao <= now || e.dias_em_transito > 3;
        })
        .slice(0, 5)
        .map((e: any) => ({
          id: e.id,
          numero: e.numero,
          tipo: 'entrega' as const,
          risco: e.dias_em_transito > 5 ? 'critico' : e.dias_em_transito > 3 ? 'alto' : 'medio',
          probabilidade_atraso: Math.min(95, 50 + e.dias_em_transito * 10),
          motivos: [`${e.dias_em_transito} dias em trânsito`, 'Previsão vencida ou próxima'],
          recomendacoes: ['Contatar transportadora', 'Verificar status atualizado'],
          horas_estimadas_atraso: e.dias_em_transito * 24,
        }));
    }

    // Calculate summary
    const summary = {
      total_analisados: entregasForAnalysis.length + coletasForAnalysis.length,
      criticos: predictions.filter(p => p.risco === 'critico').length,
      altos: predictions.filter(p => p.risco === 'alto').length,
      medios: predictions.filter(p => p.risco === 'medio').length,
      baixos: predictions.filter(p => p.risco === 'baixo').length,
      taxa_atraso_historica: delayRate,
    };

    console.log('Análise concluída:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        predictions,
        summary,
        analyzed_at: now.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na previsão de atrasos:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

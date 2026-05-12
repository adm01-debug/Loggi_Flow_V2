import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, reportId, userId, reportData } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[Scheduled Reports] Action: ${action}`);

    // Handle different actions
    switch (action) {
      case 'create': {
        const { data, error } = await supabase
          .from('scheduled_reports')
          .insert([{ ...reportData, user_id: userId }])
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, report: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { data, error } = await supabase
          .from('scheduled_reports')
          .update(reportData)
          .eq('id', reportId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, report: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { error } = await supabase
          .from('scheduled_reports')
          .delete()
          .eq('id', reportId)
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        const { data, error } = await supabase
          .from('scheduled_reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, reports: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate': {
        // Generate report data based on type
        const report = await generateReportData(supabase, reportData.report_type, reportData.filters);
        
        // Send email if recipients are provided
        if (reportData.recipients && reportData.recipients.length > 0) {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            await sendReportEmail(reportData.recipients, report, resendApiKey);
          }
        }

        return new Response(JSON.stringify({ success: true, data: report }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("[Scheduled Reports] Error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateReportData(supabase: any, reportType: string, filters: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  switch (reportType) {
    case 'entregas': {
      const { data } = await supabase
        .from('entregas')
        .select('*, transportadora:transportadoras(nome_fantasia), cliente:clientes(nome_fantasia)')
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });
      
      const total = data?.length || 0;
      const entregues = data?.filter((e: any) => e.status === 'entregue').length || 0;
      const atrasadas = data?.filter((e: any) => 
        e.previsao_entrega && new Date(e.previsao_entrega) < now && e.status !== 'entregue'
      ).length || 0;
      
      return {
        type: 'entregas',
        period: `${startOfMonth.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`,
        summary: { total, entregues, atrasadas, taxaEntrega: total > 0 ? ((entregues / total) * 100).toFixed(1) : 0 },
        items: data?.slice(0, 20) || [],
      };
    }

    case 'coletas': {
      const { data } = await supabase
        .from('coletas')
        .select('*, transportadora:transportadoras(nome_fantasia), fornecedor:fornecedores(nome_fantasia)')
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });
      
      const total = data?.length || 0;
      const finalizadas = data?.filter((c: any) => c.status === 'finalizada').length || 0;
      const pendentes = data?.filter((c: any) => ['aguardando_liberacao', 'solicitada'].includes(c.status)).length || 0;
      
      return {
        type: 'coletas',
        period: `${startOfMonth.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`,
        summary: { total, finalizadas, pendentes },
        items: data?.slice(0, 20) || [],
      };
    }

    case 'custos': {
      const { data: entregas } = await supabase
        .from('entregas')
        .select('valor_frete, transportadora:transportadoras(nome_fantasia)')
        .gte('created_at', startOfMonth.toISOString())
        .not('valor_frete', 'is', null);
      
      const totalFrete = entregas?.reduce((sum: number, e: any) => sum + (e.valor_frete || 0), 0) || 0;
      const mediaFrete = entregas?.length ? totalFrete / entregas.length : 0;
      
      // Group by transportadora
      const porTransportadora: Record<string, number> = {};
      entregas?.forEach((e: any) => {
        const nome = e.transportadora?.nome_fantasia || 'Sem transportadora';
        porTransportadora[nome] = (porTransportadora[nome] || 0) + (e.valor_frete || 0);
      });
      
      return {
        type: 'custos',
        period: `${startOfMonth.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`,
        summary: { totalFrete, mediaFrete, qtdFretes: entregas?.length || 0 },
        porTransportadora,
      };
    }

    case 'sla': {
      const { data: entregas } = await supabase
        .from('entregas')
        .select('status, previsao_entrega, data_entrega_efetiva')
        .gte('created_at', startOfMonth.toISOString());
      
      const entregues = entregas?.filter((e: any) => e.status === 'entregue') || [];
      const noPrazo = entregues.filter((e: any) => 
        e.data_entrega_efetiva && e.previsao_entrega && 
        new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega)
      ).length;
      
      return {
        type: 'sla',
        period: `${startOfMonth.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`,
        summary: {
          totalEntregues: entregues.length,
          noPrazo,
          taxaSLA: entregues.length > 0 ? ((noPrazo / entregues.length) * 100).toFixed(1) : 0,
        },
      };

async function sendReportEmail(recipients: string[], report: any, apiKey: string) {
  const subject = `LogiFlow: Relatório de ${report.type.charAt(0).toUpperCase() + report.type.slice(1)} - ${report.period}`;
  
  let html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #2563eb;">Relatório Logístico LogiFlow</h1>
      <p>Olá, este é o seu relatório agendado de <strong>${report.type}</strong>.</p>
      <p>Período: ${report.period}</p>
      
      <div style="background: #f3f4f6; padding: 20px; rounded: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Resumo</h2>
        <ul style="list-style: none; padding: 0;">
  `;

  if (report.summary) {
    for (const [key, value] of Object.entries(report.summary)) {
      html += `<li><strong>${key}:</strong> ${value}</li>`;
    }
  }

  html += `
        </ul>
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
        Este é um e-mail automático enviado pelo sistema LogiFlow.
      </p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "LogiFlow Reports <notificacoes@resend.dev>",
      to: recipients,
      subject,
      html,
    }),
  });
}

    default:
      return { type: reportType, error: 'Tipo de relatório não suportado' };
  }
}

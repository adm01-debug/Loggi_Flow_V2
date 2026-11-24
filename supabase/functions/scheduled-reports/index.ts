import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";
import { withCircuitBreaker } from "../_shared/circuitBreaker.ts";
import { requireUser } from "../_shared/auth.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import {
  requireString,
  ValidationError,
} from "../_shared/validate.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";
import {
  asRecord,
  buildReportFields,
  isAllowedAction,
} from "./fields.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req);
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  // IDOR: userId vem das claims, nunca do body (etapa 011)
  const userId = auth.claims.sub;

  try {
    const body = asRecord(await req.json());
    const { action, reportData } = body;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Ação fora da allowlist é erro do cliente (400), nunca do servidor (500).
    if (!isAllowedAction(action)) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown action: ${String(action)}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    log.info(`[Scheduled Reports] Action: ${action}`);

    // Handle different actions
    switch (action) {
      case "create": {
        const campos = buildReportFields(reportData, { exigirObrigatorios: true });
        // Etapas 143/144: só campos da allowlist; user_id vem das claims.
        const { data, error } = await supabase
          .from("scheduled_reports")
          .insert([{ ...campos, user_id: userId }])
          .select()
          .single();

        if (error) {
          // O texto do PostgREST (tabela, coluna, restrição) fica no log; a resposta é genérica.
          log.error("[Scheduled Reports] Falha ao criar relatório:", {
            code: error.code,
            message: error.message,
          });
          throw new Error("Falha ao criar relatório");
        }
        return new Response(JSON.stringify({ success: true, report: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const id = requireString(body, "reportId", { maxLength: 64 });
        const campos = buildReportFields(reportData, { exigirObrigatorios: false });
        if (Object.keys(campos).length === 0) {
          throw new ValidationError("reportData", "reportData has no updatable field");
        }
        const { data, error } = await supabase
          .from("scheduled_reports")
          .update(campos)
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, report: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const id = requireString(body, "reportId", { maxLength: 64 });
        const { error } = await supabase
          .from("scheduled_reports")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        const { data, error } = await supabase
          .from("scheduled_reports")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, reports: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "generate": {
        const geracao = asRecord(reportData);
        // Generate report data based on type
        const report = await generateReportData(
          supabase,
          requireString(geracao, "report_type", { maxLength: 64 }),
          geracao.filters,
        );

        const destinatarios = Array.isArray(geracao.recipients)
          ? geracao.recipients.filter(
            (r): r is string => typeof r === "string" && r.trim().length > 0,
          )
          : [];

        // Send email if recipients are provided
        if (destinatarios.length > 0) {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            await withCircuitBreaker("resend-api", async () => {
              await sendReportEmail(
                destinatarios,
                report,
                resendApiKey,
              );
            });
          }
        }

        return new Response(JSON.stringify({ success: true, data: report }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
  } catch (error) {
    // 422 do ValidationError segue com o campo culpado; o resto vira 500 genérico.
    return internalErrorResponse(error, corsHeaders, "scheduled-reports");
  }
};

async function generateReportData(
  supabase: any,
  reportType: string,
  filters: any,
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (reportType) {
    case "entregas": {
      const { data } = await supabase
        .from("entregas")
        .select(
          "*, transportadora:transportadoras(nome_fantasia), cliente:clientes(nome_fantasia)",
        )
        .gte("created_at", startOfMonth.toISOString())
        .order("created_at", { ascending: false });

      const deliveries = data || [];
      const total = deliveries.length;
      const entregues = deliveries.filter(
        (e: any) => e.status === "entregue",
      ).length;
      const atrasadas = deliveries.filter(
        (e: any) =>
          e.previsao_entrega &&
          new Date(e.previsao_entrega) < now &&
          e.status !== "entregue",
      ).length;

      return {
        type: "entregas",
        period: `${startOfMonth.toLocaleDateString("pt-BR")} - ${now.toLocaleDateString("pt-BR")}`,
        summary: {
          total,
          entregues,
          atrasadas,
          taxaEntrega: total > 0 ? ((entregues / total) * 100).toFixed(1) : "0",
        },
        items: deliveries.slice(0, 20),
      };
    }

    case "coletas": {
      const { data } = await supabase
        .from("coletas")
        .select(
          "*, transportadora:transportadoras(nome_fantasia), fornecedor:fornecedores(nome_fantasia)",
        )
        .gte("created_at", startOfMonth.toISOString())
        .order("created_at", { ascending: false });

      const total = data?.length || 0;
      const finalizadas =
        data?.filter((c: any) => c.status === "finalizada").length || 0;
      const pendentes =
        data?.filter((c: any) =>
          ["aguardando_liberacao", "solicitada"].includes(c.status),
        ).length || 0;

      return {
        type: "coletas",
        period: `${startOfMonth.toLocaleDateString("pt-BR")} - ${now.toLocaleDateString("pt-BR")}`,
        summary: { total, finalizadas, pendentes },
        items: data?.slice(0, 20) || [],
      };
    }

    case "custos": {
      const { data: entregas } = await supabase
        .from("entregas")
        .select("valor_frete, transportadora:transportadoras(nome_fantasia)")
        .gte("created_at", startOfMonth.toISOString())
        .not("valor_frete", "is", null);

      const totalFrete =
        entregas?.reduce(
          (sum: number, e: any) => sum + (e.valor_frete || 0),
          0,
        ) || 0;
      const mediaFrete = entregas?.length ? totalFrete / entregas.length : 0;

      // Group by transportadora
      const porTransportadora: Record<string, number> = {};
      entregas?.forEach((e: any) => {
        const nome = e.transportadora?.nome_fantasia || "Sem transportadora";
        porTransportadora[nome] =
          (porTransportadora[nome] || 0) + (e.valor_frete || 0);
      });

      return {
        type: "custos",
        period: `${startOfMonth.toLocaleDateString("pt-BR")} - ${now.toLocaleDateString("pt-BR")}`,
        summary: { totalFrete, mediaFrete, qtdFretes: entregas?.length || 0 },
        porTransportadora,
      };
    }

    case "sla": {
      const { data: entregas } = await supabase
        .from("entregas")
        .select("status, previsao_entrega, data_entrega_efetiva")
        .gte("created_at", startOfMonth.toISOString());

      const allDeliveries = entregas || [];
      const deliveredOnes = allDeliveries.filter(
        (e: any) => e.status === "entregue",
      );
      const onTime = deliveredOnes.filter(
        (e: any) =>
          e.data_entrega_efetiva &&
          e.previsao_entrega &&
          new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega),
      ).length;

      return {
        type: "sla",
        period: `${startOfMonth.toLocaleDateString("pt-BR")} - ${now.toLocaleDateString("pt-BR")}`,
        summary: {
          totalEntregues: deliveredOnes.length,
          noPrazo: onTime,
          taxaSLA:
            deliveredOnes.length > 0
              ? ((onTime / deliveredOnes.length) * 100).toFixed(1)
              : "0",
        },
      };
    }

    default:
      return { type: reportType, error: "Tipo de relatório não suportado" };
  }
}

async function sendReportEmail(
  recipients: string[],
  report: any,
  apiKey: string,
) {
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

  try {
    const res = await safeFetch("https://api.resend.com/emails", {
      circuitBreakerName: null, // breaker "resend-api" ja aplicado no withCircuitBreaker (se usado no envio)
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "LogiFlow Reports <notificacoes@promobrindes.com.br>",
        to: recipients,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      log.error("[Scheduled Reports] Resend API error:", errorData);
    } else {
      log.info(
        "[Scheduled Reports] Email sent successfully to:",
        { recipients: recipients.join(", ") },
      );
    }
  } catch (err) {
    log.error("[Scheduled Reports] Failed to send email:", { err });
  }
}

serve(handler);

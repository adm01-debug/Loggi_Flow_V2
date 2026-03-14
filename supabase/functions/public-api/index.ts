import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { requireString, requireEnum, ValidationError, validationErrorResponse } from "../_shared/validate.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    // --- Rate Limiting (30 req/min for public API) ---
    const rl = await checkRateLimit(req, "public-api", { maxRequests: 30 });
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests", retry_after: 900 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/public-api", "");
    const apiKey = req.headers.get("x-api-key");

    // API key validation
    if (!apiKey || !apiKey.startsWith("lf_") || apiKey.length < 20) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid or missing API key." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- Validated query params ---
    const safeLimit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50") || 50, 1), 200);
    const safeOffset = Math.max(parseInt(url.searchParams.get("offset") || "0") || 0, 0);

    // Route handling
    const routes: Record<string, () => Promise<Response>> = {
      "GET:/entregas": async () => {
        const status = url.searchParams.get("status");
        let query = supabase
          .from("entregas")
          .select(`id, numero_entrega, status, endereco_entrega, previsao_entrega,
            data_entrega_efetiva, codigo_rastreamento, created_at,
            cliente:clientes(razao_social),
            transportadora:transportadoras(nome_fantasia)`, { count: "exact" })
          .order("created_at", { ascending: false })
          .range(safeOffset, safeOffset + safeLimit - 1);

        if (status) query = query.eq("status", status);
        const { data, error, count } = await query;
        if (error) throw error;

        return new Response(
          JSON.stringify({ data, total: count, limit: safeLimit, offset: safeOffset }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      "GET:/entregas/:id": async () => {
        const id = path.split("/")[2];
        if (!id || id.length < 10) {
          return new Response(JSON.stringify({ error: "Invalid ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data, error } = await supabase.from("entregas")
          .select(`*, cliente:clientes(*), transportadora:transportadoras(*)`)
          .eq("id", id).single();
        if (error) {
          if (error.code === "PGRST116") return new Response(JSON.stringify({ error: "Not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          throw error;
        }
        return new Response(JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      },

      "GET:/coletas": async () => {
        const status = url.searchParams.get("status");
        let query = supabase.from("coletas")
          .select(`id, numero_coleta, status, endereco_coleta, data_prevista_coleta,
            data_efetiva_coleta, codigo_rastreamento, tipo_coleta, created_at,
            fornecedor:fornecedores(razao_social),
            transportadora:transportadoras(nome_fantasia)`, { count: "exact" })
          .order("created_at", { ascending: false })
          .range(safeOffset, safeOffset + safeLimit - 1);
        if (status) query = query.eq("status", status);
        const { data, error, count } = await query;
        if (error) throw error;
        return new Response(JSON.stringify({ data, total: count, limit: safeLimit, offset: safeOffset }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      },

      "GET:/coletas/:id": async () => {
        const id = path.split("/")[2];
        if (!id || id.length < 10) {
          return new Response(JSON.stringify({ error: "Invalid ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data, error } = await supabase.from("coletas")
          .select(`*, fornecedor:fornecedores(*), transportadora:transportadoras(*)`)
          .eq("id", id).single();
        if (error) {
          if (error.code === "PGRST116") return new Response(JSON.stringify({ error: "Not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          throw error;
        }
        return new Response(JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      },

      "GET:/transportadoras": async () => {
        const homologada = url.searchParams.get("homologada");
        let query = supabase.from("transportadoras")
          .select("id, nome_fantasia, razao_social, cnpj, score_performance, homologada, prazo_medio_dias, regioes_atendidas")
          .order("nome_fantasia");
        if (homologada !== null) query = query.eq("homologada", homologada === "true");
        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      },

      "GET:/clientes": async () => {
        const { data, error } = await supabase.from("clientes")
          .select("id, razao_social, nome_fantasia, cnpj, cidade, estado")
          .order("razao_social");
        if (error) throw error;
        return new Response(JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      },

      "GET:/rastrear/:codigo": async () => {
        const codigo = path.split("/")[2];
        if (!codigo || codigo.length < 3 || codigo.length > 100) {
          return new Response(JSON.stringify({ error: "Invalid tracking code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: entrega } = await supabase.from("entregas")
          .select(`id, numero_entrega, status, endereco_entrega, previsao_entrega,
            data_entrega_efetiva, codigo_rastreamento, link_rastreamento,
            transportadora:transportadoras(nome_fantasia)`)
          .or(`codigo_rastreamento.eq.${codigo},numero_entrega.eq.${codigo}`)
          .maybeSingle();
        if (entrega) return new Response(JSON.stringify({ type: "entrega", data: entrega }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: coleta } = await supabase.from("coletas")
          .select(`id, numero_coleta, status, endereco_coleta, data_prevista_coleta,
            data_efetiva_coleta, codigo_rastreamento, link_rastreamento,
            transportadora:transportadoras(nome_fantasia)`)
          .or(`codigo_rastreamento.eq.${codigo},numero_coleta.eq.${codigo}`)
          .maybeSingle();
        if (coleta) return new Response(JSON.stringify({ type: "coleta", data: coleta }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        return new Response(JSON.stringify({ error: "Not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      },

      "POST:/webhook/status": async () => {
        const body = await req.json();
        try {
          const tipo = requireEnum(body, "tipo", ["entrega", "coleta"] as const);
          const codigo = requireString(body, "codigo", { minLength: 3, maxLength: 100 });
          const status = requireString(body, "status", { minLength: 2, maxLength: 50 });
          const observacao = body.observacao as string | undefined;

          const table = tipo === "entrega" ? "entregas" : "coletas";
          const codeField = tipo === "entrega" ? "numero_entrega" : "numero_coleta";
          const { error } = await supabase.from(table)
            .update({ status, observacoes: observacao, updated_at: new Date().toISOString() })
            .eq(codeField, codigo);
          if (error) throw error;

          return new Response(JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } catch (err) {
          if (err instanceof ValidationError) return validationErrorResponse(err, corsHeaders);
          throw err;
        }
      },

      "GET:/stats": async () => {
        const [entregas, coletas, transportadoras] = await Promise.all([
          supabase.from("entregas").select("status", { count: "exact" }),
          supabase.from("coletas").select("status", { count: "exact" }),
          supabase.from("transportadoras").select("id", { count: "exact" }).eq("homologada", true),
        ]);
        return new Response(JSON.stringify({
          data: {
            total_entregas: entregas.count || 0,
            total_coletas: coletas.count || 0,
            transportadoras_ativas: transportadoras.count || 0,
            timestamp: new Date().toISOString(),
          }
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      },
    };

    // Match route
    let routeKey = `${req.method}:${path}`;
    let handler = routes[routeKey];

    if (!handler) {
      const pathParts = path.split("/").filter(Boolean);
      if (pathParts.length === 2) {
        handler = routes[`${req.method}:/${pathParts[0]}/:id`];
        if (pathParts[0] === "rastrear") handler = routes[`${req.method}:/rastrear/:codigo`];
      }
    }

    if (!handler) {
      if (path === "" || path === "/") {
        return new Response(JSON.stringify({
          name: "LogiFlow Public API", version: "1.1.0",
          endpoints: [
            { method: "GET", path: "/entregas" }, { method: "GET", path: "/entregas/:id" },
            { method: "GET", path: "/coletas" }, { method: "GET", path: "/coletas/:id" },
            { method: "GET", path: "/transportadoras" }, { method: "GET", path: "/clientes" },
            { method: "GET", path: "/rastrear/:codigo" }, { method: "GET", path: "/stats" },
            { method: "POST", path: "/webhook/status" },
          ],
          authentication: "Header 'x-api-key'",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return await handler();
  } catch (error: unknown) {
    console.error("[public-api] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

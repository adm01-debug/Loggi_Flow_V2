import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Simple API key validation (in production, use a database table)
const validateApiKey = (apiKey: string | null): boolean => {
  if (!apiKey) return false;
  // Accept any key starting with "lf_" for demo purposes
  // In production, validate against a database table
  return apiKey.startsWith("lf_") && apiKey.length >= 20;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/public-api", "");
    const apiKey = req.headers.get("x-api-key");

    console.log("[public-api] Request:", req.method, path);

    // API key validation
    if (!validateApiKey(apiKey)) {
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized", 
          message: "Invalid or missing API key. Use header 'x-api-key' with a valid key." 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route handling
    const routes: Record<string, () => Promise<Response>> = {
      // GET /entregas - List deliveries
      "GET:/entregas": async () => {
        const status = url.searchParams.get("status");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
          .from("entregas")
          .select(`
            id, numero_entrega, status, endereco_entrega, previsao_entrega,
            data_entrega_efetiva, codigo_rastreamento, created_at,
            cliente:clientes(razao_social),
            transportadora:transportadoras(nome_fantasia)
          `, { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ data, total: count, limit, offset }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // GET /entregas/:id - Get single delivery
      "GET:/entregas/:id": async () => {
        const id = path.split("/")[2];
        
        const { data, error } = await supabase
          .from("entregas")
          .select(`
            *,
            cliente:clientes(*),
            transportadora:transportadoras(*)
          `)
          .eq("id", id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw error;
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // GET /coletas - List collections
      "GET:/coletas": async () => {
        const status = url.searchParams.get("status");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
          .from("coletas")
          .select(`
            id, numero_coleta, status, endereco_coleta, data_prevista_coleta,
            data_efetiva_coleta, codigo_rastreamento, tipo_coleta, created_at,
            fornecedor:fornecedores(razao_social),
            transportadora:transportadoras(nome_fantasia)
          `, { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ data, total: count, limit, offset }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // GET /coletas/:id - Get single collection
      "GET:/coletas/:id": async () => {
        const id = path.split("/")[2];
        
        const { data, error } = await supabase
          .from("coletas")
          .select(`
            *,
            fornecedor:fornecedores(*),
            transportadora:transportadoras(*)
          `)
          .eq("id", id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw error;
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // GET /transportadoras - List carriers
      "GET:/transportadoras": async () => {
        const homologada = url.searchParams.get("homologada");

        let query = supabase
          .from("transportadoras")
          .select("id, nome_fantasia, razao_social, cnpj, score_performance, homologada, prazo_medio_dias, regioes_atendidas")
          .order("nome_fantasia");

        if (homologada !== null) {
          query = query.eq("homologada", homologada === "true");
        }

        const { data, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // GET /clientes - List clients
      "GET:/clientes": async () => {
        const { data, error } = await supabase
          .from("clientes")
          .select("id, razao_social, nome_fantasia, cnpj, cidade, estado")
          .order("razao_social");

        if (error) throw error;

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // GET /rastrear/:codigo - Track by code
      "GET:/rastrear/:codigo": async () => {
        const codigo = path.split("/")[2];

        // Search in entregas
        const { data: entrega } = await supabase
          .from("entregas")
          .select(`
            id, numero_entrega, status, endereco_entrega, previsao_entrega,
            data_entrega_efetiva, codigo_rastreamento, link_rastreamento,
            transportadora:transportadoras(nome_fantasia)
          `)
          .or(`codigo_rastreamento.eq.${codigo},numero_entrega.eq.${codigo}`)
          .maybeSingle();

        if (entrega) {
          return new Response(
            JSON.stringify({ type: "entrega", data: entrega }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Search in coletas
        const { data: coleta } = await supabase
          .from("coletas")
          .select(`
            id, numero_coleta, status, endereco_coleta, data_prevista_coleta,
            data_efetiva_coleta, codigo_rastreamento, link_rastreamento,
            transportadora:transportadoras(nome_fantasia)
          `)
          .or(`codigo_rastreamento.eq.${codigo},numero_coleta.eq.${codigo}`)
          .maybeSingle();

        if (coleta) {
          return new Response(
            JSON.stringify({ type: "coleta", data: coleta }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "Not found", message: "Código de rastreamento não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // POST /webhook/status - Receive status updates
      "POST:/webhook/status": async () => {
        const body = await req.json();
        const { tipo, codigo, status, data_atualizacao, observacao } = body;

        console.log("[public-api] Webhook received:", body);

        if (!tipo || !codigo || !status) {
          return new Response(
            JSON.stringify({ error: "Bad request", message: "Missing required fields: tipo, codigo, status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const table = tipo === "entrega" ? "entregas" : "coletas";
        const codeField = tipo === "entrega" ? "numero_entrega" : "numero_coleta";

        const { error } = await supabase
          .from(table)
          .update({ 
            status, 
            observacoes: observacao,
            updated_at: data_atualizacao || new Date().toISOString()
          })
          .eq(codeField, codigo);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: "Status atualizado com sucesso" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },

      // GET /stats - Get general statistics
      "GET:/stats": async () => {
        const [entregas, coletas, transportadoras] = await Promise.all([
          supabase.from("entregas").select("status", { count: "exact" }),
          supabase.from("coletas").select("status", { count: "exact" }),
          supabase.from("transportadoras").select("id", { count: "exact" }).eq("homologada", true),
        ]);

        return new Response(
          JSON.stringify({
            data: {
              total_entregas: entregas.count || 0,
              total_coletas: coletas.count || 0,
              transportadoras_ativas: transportadoras.count || 0,
              timestamp: new Date().toISOString(),
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      },
    };

    // Match route
    let routeKey = `${req.method}:${path}`;
    let handler = routes[routeKey];

    // Check for parameterized routes
    if (!handler) {
      const pathParts = path.split("/").filter(Boolean);
      if (pathParts.length === 2) {
        const paramRoute = `${req.method}:/${pathParts[0]}/:id`;
        if (routes[paramRoute]) {
          handler = routes[paramRoute];
        }
        // Check for rastrear route
        const rastrearRoute = `${req.method}:/rastrear/:codigo`;
        if (pathParts[0] === "rastrear" && routes[rastrearRoute]) {
          handler = routes[rastrearRoute];
        }
      }
    }

    if (!handler) {
      // Return API documentation
      if (path === "" || path === "/") {
        return new Response(
          JSON.stringify({
            name: "LogiFlow Public API",
            version: "1.0.0",
            endpoints: [
              { method: "GET", path: "/entregas", description: "List all deliveries" },
              { method: "GET", path: "/entregas/:id", description: "Get delivery by ID" },
              { method: "GET", path: "/coletas", description: "List all collections" },
              { method: "GET", path: "/coletas/:id", description: "Get collection by ID" },
              { method: "GET", path: "/transportadoras", description: "List all carriers" },
              { method: "GET", path: "/clientes", description: "List all clients" },
              { method: "GET", path: "/rastrear/:codigo", description: "Track by code" },
              { method: "GET", path: "/stats", description: "Get general statistics" },
              { method: "POST", path: "/webhook/status", description: "Receive status updates" },
            ],
            authentication: "Use header 'x-api-key' with your API key",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Not found", message: "Endpoint not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return await handler();
  } catch (error: unknown) {
    console.error("[public-api] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

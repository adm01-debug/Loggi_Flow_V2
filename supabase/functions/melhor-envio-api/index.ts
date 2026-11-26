import { safeFetch } from "../_shared/safeFetch.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { getCircuitBreaker } from "../_shared/circuitBreaker.ts";
import { getRedisClient } from "../_shared/redis.ts";
import { log } from "../_shared/logger.ts";
import { requireRole } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { ValidationError, validationErrorResponse } from "../_shared/validate.ts";
import { parseMelhorEnvioQuote } from "./parse.ts";
import { resolveMelhorEnvioAmbiente } from "./ambiente.ts";

const SANDBOX_URL = "https://sandbox.melhorenvio.com.br/api/v2";
const PRODUCTION_URL = "https://melhorenvio.com.br/api/v2";

const meBreaker = getCircuitBreaker('melhor-envio', {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
});

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    const rl = await checkRateLimit(req, "melhor-envio-api", {
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "rate_limited" }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }

    // Etapa 009: cotar e enviar exige papel de colaborador (admin ou user); autenticado sem papel nao passa
    const auth = await requireRole(req, ["admin", "user"]);
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ error: auth.status === 403 ? "Forbidden" : "Unauthorized" }),
        { status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, params, useSandbox } = body ?? {};

    // Etapa 008: quem decide o ambiente e o servidor. A acao `ambiente` so devolve a configuracao - nao
    // chama o parceiro nem depende do token -, para o aviso do painel nao mentir quando falta credencial.
    const ambiente = resolveMelhorEnvioAmbiente({
      sandbox: Deno.env.get("MELHOR_ENVIO_SANDBOX"),
      supabaseUrl: Deno.env.get("SUPABASE_URL"),
    });

    if (action === "ambiente") {
      return new Response(
        JSON.stringify({ ambiente }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "MELHOR_ENVIO_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Campo aceito por compatibilidade e ignorado de proposito: o log aponta quem ainda o envia.
    if (typeof useSandbox === "boolean") {
      log.info("melhor-envio: campo useSandbox do corpo ignorado (o ambiente vem do servidor)", {
        useSandbox,
        ambiente,
      });
    }

    const baseUrl = ambiente === "sandbox" ? SANDBOX_URL : PRODUCTION_URL;

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "LogiFlow (adm04@promobrindes.com.br)",
    };

    let url: string;
    let method = "GET";
    let fetchBody: string | undefined;

    switch (action) {
      // === COTAÇÃO ===
      case "calcularFrete": {
        const quote = parseMelhorEnvioQuote(params);
        const redis = getRedisClient();
        const cacheKey = `me_quote_${btoa(JSON.stringify(quote))}`;
        if (redis) {
          try {
            const cached = await redis.get(cacheKey);
            if (cached) {
              return new Response(JSON.stringify(cached), {
                headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
              });
            }
          } catch (e) {
            log({ level: 'WARN', message: 'Redis cache fail', meta: { error: e.message } });
          }
        }

        url = `${baseUrl}/me/shipment/calculate`;
        method = "POST";
        fetchBody = JSON.stringify(quote);

        const response = await meBreaker.execute(async () => {
          const res = await safeFetch(url, { method, headers, body: fetchBody });
          if (!res.ok && res.status >= 500) throw new Error(`ME API Server Error: ${res.status}`);
          return res;
        });

        const data = await response.json();
        if (response.ok && redis) {
          try {
            await redis.set(cacheKey, data, { ex: 600 }); // 10 minutes cache
          } catch (e) {}
        }

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
        });
      }

      // === CARRINHO ===
      case "inserirCarrinho":
        url = `${baseUrl}/me/cart`;
        method = "POST";
        fetchBody = JSON.stringify(params);
        break;

      case "inserirLogisticaReversa":
        url = `${baseUrl}/me/cart`;
        method = "POST";
        fetchBody = JSON.stringify({ ...params, reverse: true });
        break;

      case "listarCarrinho":
        url = `${baseUrl}/me/cart`;
        break;

      case "exibirItemCarrinho":
        url = `${baseUrl}/me/cart/${params.id}`;
        break;

      case "removerItemCarrinho":
        url = `${baseUrl}/me/cart/${params.id}`;
        method = "DELETE";
        break;

      case "comprarFretes":
        url = `${baseUrl}/me/shipment/checkout`;
        method = "POST";
        fetchBody = JSON.stringify({ orders: params.orders });
        break;

      // === ETIQUETAS ===
      case "gerarEtiquetas":
        url = `${baseUrl}/me/shipment/generate`;
        method = "POST";
        fetchBody = JSON.stringify({ orders: params.orders });
        break;

      case "imprimirEtiquetas":
        url = `${baseUrl}/me/shipment/print`;
        method = "POST";
        fetchBody = JSON.stringify({ orders: params.orders, mode: params.mode || "public" });
        break;

      case "imprimirEtiquetasArquivo":
        url = `${baseUrl}/me/shipment/print/${params.id}`;
        break;

      case "preVisualizarEtiquetas":
        url = `${baseUrl}/me/shipment/preview`;
        method = "POST";
        fetchBody = JSON.stringify({ orders: params.orders });
        break;

      // === PESQUISA E CANCELAMENTO ===
      case "pesquisarEtiqueta":
        const searchParams = new URLSearchParams();
        if (params.status) searchParams.set("status", params.status);
        if (params.q) searchParams.set("q", params.q);
        if (params.page) searchParams.set("page", params.page);
        url = `${baseUrl}/me/orders?${searchParams.toString()}`;
        break;

      case "listarEtiquetas":
        const listParams = new URLSearchParams();
        if (params.status) listParams.set("status", params.status);
        if (params.page) listParams.set("page", params.page);
        if (params.per_page) listParams.set("per_page", params.per_page);
        url = `${baseUrl}/me/orders?${listParams.toString()}`;
        break;

      case "infoEtiqueta":
        url = `${baseUrl}/me/orders/${params.id}`;
        break;

      case "verificarCancelamento":
        url = `${baseUrl}/me/shipment/cancellable`;
        method = "POST";
        fetchBody = JSON.stringify({ orders: params.orders });
        break;

      case "cancelarEtiquetas":
        url = `${baseUrl}/me/shipment/cancel`;
        method = "POST";
        fetchBody = JSON.stringify({ orders: params.orders, description: params.description });
        break;

      // === RASTREAMENTO ===
      case "rastrearEnvios":
        url = `${baseUrl}/me/shipment/tracking`;
        method = "POST";
        fetchBody = JSON.stringify({ orders: params.orders });
        break;

      // === TRANSPORTADORAS E SERVIÇOS ===
      case "listarTransportadoras":
        url = `${baseUrl}/me/shipment/companies`;
        break;

      case "infoTransportadora":
        url = `${baseUrl}/me/shipment/companies/${params.id}`;
        break;

      case "listarServicos":
        url = `${baseUrl}/me/shipment/services`;
        break;

      case "infoServico":
        url = `${baseUrl}/me/shipment/services/${params.id}`;
        break;

      case "listarAgencias": {
        const agParams = new URLSearchParams();
        if (params.company) agParams.set("company", params.company);
        if (params.country) agParams.set("country", params.country);
        if (params.state) agParams.set("state", params.state);
        if (params.city) agParams.set("city", params.city);
        url = `${baseUrl}/me/shipment/agencies?${agParams.toString()}`;
        break;
      }

      case "infoAgencia":
        url = `${baseUrl}/me/shipment/agencies/${params.id}`;
        break;

      // === USUÁRIO ===
      case "infoUsuario":
        url = `${baseUrl}/me`;
        break;

      case "enderecosUsuario":
        url = `${baseUrl}/me/addresses`;
        break;

      case "saldoUsuario":
        url = `${baseUrl}/me/balance`;
        break;

      case "inserirSaldo":
        url = `${baseUrl}/me/balance`;
        method = "POST";
        fetchBody = JSON.stringify(params);
        break;

      // === LOJAS ===
      case "listarLojas":
        url = `${baseUrl}/me/companies`;
        break;

      case "cadastrarLoja":
        url = `${baseUrl}/me/companies`;
        method = "POST";
        fetchBody = JSON.stringify(params);
        break;

      case "visualizarLoja":
        url = `${baseUrl}/me/companies/${params.id}`;
        break;

      case "cadastrarEnderecoLoja":
        url = `${baseUrl}/me/companies/${params.company_id}/addresses`;
        method = "POST";
        fetchBody = JSON.stringify(params.address);
        break;

      case "listarEnderecosLoja":
        url = `${baseUrl}/me/companies/${params.company_id}/addresses`;
        break;

      case "cadastrarTelefonesLoja":
        url = `${baseUrl}/me/companies/${params.company_id}/phones`;
        method = "POST";
        fetchBody = JSON.stringify(params.phones);
        break;

      case "listarTelefonesLoja":
        url = `${baseUrl}/me/companies/${params.company_id}/phones`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }


    // For calcularFrete, we already returned early with cache or custom response
    if (action === "calcularFrete") return new Response(null); // Should not reach here

    const response = await meBreaker.execute(async () => {
      const res = await safeFetch(url, {
        method,
        headers,
        body: fetchBody,
      });

      if (!res.ok && res.status >= 500) {
        throw new Error(`ME API Server Error: ${res.status}`);
      }
      return res;
    });

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: "Non-JSON response from API", details: text };
    }

    if (!response.ok) {
      log({ level: 'WARN', message: `Melhor Envio API error: ${response.status}`, meta: { action, data } });
      return new Response(
        JSON.stringify({ 
          error: data.message || data.error || "API error", 
          details: data 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders);
    }

    const isBreaker = (error as Error).message.includes('Circuit Breaker');
    log({ level: 'ERROR', message: `Melhor Envio function failure`, meta: { error: (error as Error).message } });
    
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        circuitOpen: isBreaker 
      }),
      { status: isBreaker ? 503 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

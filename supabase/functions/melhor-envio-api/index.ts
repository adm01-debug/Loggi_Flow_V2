import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SANDBOX_URL = "https://sandbox.melhorenvio.com.br/api/v2";
const PRODUCTION_URL = "https://melhorenvio.com.br/api/v2";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "MELHOR_ENVIO_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, params, useSandbox = true } = body;
    const baseUrl = useSandbox ? SANDBOX_URL : PRODUCTION_URL;

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
      case "calcularFrete":
        url = `${baseUrl}/me/shipment/calculate`;
        method = "POST";
        fetchBody = JSON.stringify(params);
        break;

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

    console.log(`[ME API] ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: fetchBody,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[ME API] Error ${response.status}:`, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data.message || data.error || "API error", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ME API] Internal error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

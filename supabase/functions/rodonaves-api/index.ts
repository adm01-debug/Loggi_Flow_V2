import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { requireString, requireNumber, ValidationError, validationErrorResponse } from "../_shared/validate.ts";

// Rodonaves API Gateways
const TRACKING_GATEWAY = "https://tracking-apigateway.rte.com.br";
const QUOTATION_GATEWAY = "https://quotation-apigateway.rte.com.br";
const DEADLINE_GATEWAY = "https://01wapi.rte.com.br";
const PICKUP_GATEWAY = "https://pickup-apigateway.rte.com.br";

// Token cache (in-memory per isolate)
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getToken(gateway: string): Promise<string> {
  const cached = tokenCache[gateway];
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const username = Deno.env.get("RODONAVES_USERNAME");
  const password = Deno.env.get("RODONAVES_PASSWORD");
  if (!username || !password) throw new Error("RODONAVES credentials not configured");

  const response = await fetch(`${gateway}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ auth_type: "DEV", grant_type: "password", username, password }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth failed [${response.status}]: ${text}`);
  }
  const data = await response.json();
  tokenCache[gateway] = { token: data.access_token, expiresAt: Date.now() + 25 * 60_000 };
  return data.access_token;
}

function mapTrackingCodeToStatus(code: number): string {
  switch (code) {
    case 0: return "em_transito";
    case 1: case 2: case 24: case 29: case 31: return "entregue";
    case 37: case 43: return "saiu_entrega";
    case 44: case 45: case 46: return "despachado";
    case 38: case 39: case 47: case 58: return "em_transito";
    case 25: case 3: case 4: case 5: case 6: case 7: case 8: case 9:
    case 10: case 11: case 12: case 13: case 14: case 15:
    case 16: case 17: case 18: case 19: case 20: case 21:
    case 22: case 23: case 26: case 27: case 28: case 30:
      return "ocorrencia";
    default: return "em_transito";
  }
}

// ===== TRACKING (GET) =====
async function trackShipment(params: {
  taxIdRegistration?: string;
  invoiceNumber?: string;
  invoiceKey?: string;
  protocolNumber?: string;
  cTeNumber?: number;
  isCustomerPortal?: boolean;
}) {
  const token = await getToken(TRACKING_GATEWAY);
  const qs = new URLSearchParams();
  if (params.taxIdRegistration) qs.set("TaxIdRegistration", params.taxIdRegistration);
  if (params.invoiceNumber) qs.set("InvoiceNumber", params.invoiceNumber);
  if (params.invoiceKey) qs.set("InvoiceKey", params.invoiceKey);
  if (params.protocolNumber) qs.set("ProtocolNumber", params.protocolNumber);
  if (params.cTeNumber) qs.set("CTeNumber", String(params.cTeNumber));
  if (params.isCustomerPortal) qs.set("IsCustomerPortal", "true");

  const res = await fetch(`${TRACKING_GATEWAY}/api/v1/tracking?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Tracking failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== BATCH TRACKING (GET) =====
async function trackBatch(params: {
  taxIdRegistration: string;
  startDate: string;
  endDate: string;
  page?: number;
  amountByPage?: number;
  operationType?: number;
}) {
  const token = await getToken(TRACKING_GATEWAY);
  const qs = new URLSearchParams({
    TaxIdRegistration: params.taxIdRegistration,
    StartDate: params.startDate,
    EndDate: params.endDate,
  });
  if (params.page) qs.set("Page", String(params.page));
  if (params.amountByPage) qs.set("AmountByPage", String(params.amountByPage));
  if (params.operationType !== undefined) qs.set("OperationType", String(params.operationType));

  const res = await fetch(`${TRACKING_GATEWAY}/api/v1/tracking/batch?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Batch tracking failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== TRACKING STEPS (GET) =====
async function trackingSteps(params: {
  taxIdRegistration?: string;
  invoiceNumber?: string;
  invoiceKey?: string;
  protocolNumber?: string;
}) {
  const token = await getToken(TRACKING_GATEWAY);
  const qs = new URLSearchParams();
  if (params.taxIdRegistration) qs.set("TaxIdRegistration", params.taxIdRegistration);
  if (params.invoiceNumber) qs.set("InvoiceNumber", params.invoiceNumber);
  if (params.invoiceKey) qs.set("InvoiceKey", params.invoiceKey);
  if (params.protocolNumber) qs.set("ProtocolNumber", params.protocolNumber);

  const res = await fetch(`${TRACKING_GATEWAY}/api/v1/tracking/trackingSteps?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Tracking steps failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== DELIVERY RECEIPT (GET) =====
async function getDeliveryProof(params: {
  taxIdRegistration?: string;
  invoiceNumber?: string;
  invoiceKey?: string;
  protocolNumber?: string;
}) {
  const token = await getToken(TRACKING_GATEWAY);
  const qs = new URLSearchParams();
  if (params.taxIdRegistration) qs.set("TaxIdRegistration", params.taxIdRegistration);
  if (params.invoiceNumber) qs.set("InvoiceNumber", params.invoiceNumber);
  if (params.invoiceKey) qs.set("InvoiceKey", params.invoiceKey);
  if (params.protocolNumber) qs.set("ProtocolNumber", params.protocolNumber);

  const res = await fetch(`${TRACKING_GATEWAY}/api/v1/deliveryreceipt?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Delivery proof failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== DELIVERY INFO (GET) =====
async function getDeliveryInfo(params: {
  taxIdRegistration?: string;
  invoiceNumber?: string;
  protocolNumber?: string;
}) {
  const token = await getToken(TRACKING_GATEWAY);
  const qs = new URLSearchParams();
  if (params.taxIdRegistration) qs.set("TaxIdRegistration", params.taxIdRegistration);
  if (params.invoiceNumber) qs.set("InvoiceNumber", params.invoiceNumber);
  if (params.protocolNumber) qs.set("ProtocolNumber", params.protocolNumber);

  const res = await fetch(`${TRACKING_GATEWAY}/api/v1/deliveryreceipt/deliveryInformation?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Delivery info failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== ORDERS PAGINATED (GET) =====
async function getOrders(params: {
  taxIdRegistration: string;
  customerType: number;
  startDate: string;
  endDate: string;
  page?: number;
  amountByPage?: number;
  invoiceNumber?: string;
}) {
  const token = await getToken(TRACKING_GATEWAY);
  const qs = new URLSearchParams({
    TaxIdRegistration: params.taxIdRegistration,
    CustomerType: String(params.customerType),
    StartDate: params.startDate,
    EndDate: params.endDate,
  });
  if (params.page) qs.set("Page", String(params.page));
  if (params.amountByPage) qs.set("AmountByPage", String(params.amountByPage));
  if (params.invoiceNumber) qs.set("InvoiceNumber", params.invoiceNumber);

  const res = await fetch(`${TRACKING_GATEWAY}/api/v1/orders/ordersbydaterangepagination?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Orders failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== QUOTATION (POST) =====
async function simulateQuotation(params: {
  cepOrigem: string;
  cepDestino: string;
  peso: number;
  volumes: number;
  valorMercadoria: number;
  cnpjRemetente: string;
}) {
  const token = await getToken(QUOTATION_GATEWAY);
  const res = await fetch(`${QUOTATION_GATEWAY}/api/v1/simula-cotacao`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      CepOrigem: params.cepOrigem,
      CepDestino: params.cepDestino,
      Peso: params.peso,
      Volumes: params.volumes,
      ValorMercadoria: params.valorMercadoria,
      CnpjRemetente: params.cnpjRemetente,
    }),
  });
  if (!res.ok) throw new Error(`Quotation failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== CUBAGE FACTOR (GET) =====
async function getCubageFactor(taxIdRegistration: string, companyId?: string) {
  const token = await getToken(QUOTATION_GATEWAY);
  const qs = new URLSearchParams({ taxIdRegistration });
  if (companyId) qs.set("companyId", companyId);

  const res = await fetch(`${QUOTATION_GATEWAY}/api/v1/peso-cubado?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Cubage failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== DEADLINE (POST) =====
async function getDeadline(cepOrigem: string, cepDestino: string) {
  const token = await getToken(DEADLINE_GATEWAY);
  const res = await fetch(`${DEADLINE_GATEWAY}/api/v1/busca-prazo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ CepOrigem: cepOrigem, CepDestino: cepDestino }),
  });
  if (!res.ok) throw new Error(`Deadline failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// ===== MAIN HANDLER =====
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    const rl = await checkRateLimit(req, "rodonaves-api", { maxRequests: 20 });
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests", retry_after: 900 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, ...params } = body;

    if (!action || typeof action !== "string") {
      return new Response(
        JSON.stringify({ error: "Validation error", message: "action is required" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: unknown;
    const cnpjDefault = Deno.env.get("RODONAVES_CNPJ_REMETENTE") || "";

    switch (action) {
      case "track": {
        result = await trackShipment({
          taxIdRegistration: params.cnpjRemetente || cnpjDefault,
          invoiceNumber: params.nfNumero,
          invoiceKey: params.invoiceKey,
          protocolNumber: params.protocolNumber,
          isCustomerPortal: params.isCustomerPortal,
        });
        break;
      }

      case "track-batch": {
        const taxId = requireString(params, "cnpjRemetente", { minLength: 11 });
        const startDate = requireString(params, "startDate");
        const endDate = requireString(params, "endDate");
        result = await trackBatch({
          taxIdRegistration: taxId || cnpjDefault,
          startDate,
          endDate,
          page: params.page,
          amountByPage: params.amountByPage || 50,
        });
        break;
      }

      case "tracking-steps": {
        result = await trackingSteps({
          taxIdRegistration: params.cnpjRemetente || cnpjDefault,
          invoiceNumber: params.nfNumero,
          invoiceKey: params.invoiceKey,
          protocolNumber: params.protocolNumber,
        });
        break;
      }

      case "delivery-proof": {
        result = await getDeliveryProof({
          taxIdRegistration: params.cnpjRemetente || cnpjDefault,
          invoiceNumber: params.nfNumero,
          invoiceKey: params.invoiceKey,
          protocolNumber: params.protocolNumber,
        });
        break;
      }

      case "delivery-info": {
        result = await getDeliveryInfo({
          taxIdRegistration: params.cnpjRemetente || cnpjDefault,
          invoiceNumber: params.nfNumero,
          protocolNumber: params.protocolNumber,
        });
        break;
      }

      case "orders": {
        const taxId = requireString(params, "cnpjRemetente", { minLength: 11 });
        const startDate = requireString(params, "startDate");
        const endDate = requireString(params, "endDate");
        result = await getOrders({
          taxIdRegistration: taxId || cnpjDefault,
          customerType: params.customerType ?? 1, // default: Remetente
          startDate,
          endDate,
          page: params.page,
          amountByPage: params.amountByPage || 20,
          invoiceNumber: params.invoiceNumber,
        });
        break;
      }

      case "quotation": {
        const cepOrigem = requireString(params, "cepOrigem", { pattern: /^\d{5}-?\d{3}$/ });
        const cepDestino = requireString(params, "cepDestino", { pattern: /^\d{5}-?\d{3}$/ });
        const peso = requireNumber(params, "peso", { min: 0.01, max: 100000 });
        const volumes = requireNumber(params, "volumes", { min: 1, max: 10000 });
        const valorMercadoria = requireNumber(params, "valorMercadoria", { min: 0 });
        const cnpjRemetente = params.cnpjRemetente || cnpjDefault;
        result = await simulateQuotation({ cepOrigem, cepDestino, peso, volumes, valorMercadoria, cnpjRemetente });
        break;
      }

      case "cubage-factor": {
        const taxId = requireString(params, "cnpjRemetente", { minLength: 11 });
        result = await getCubageFactor(taxId || cnpjDefault, params.companyId);
        break;
      }

      case "deadline": {
        const cepOrigem = requireString(params, "cepOrigem", { pattern: /^\d{5}-?\d{3}$/ });
        const cepDestino = requireString(params, "cepDestino", { pattern: /^\d{5}-?\d{3}$/ });
        result = await getDeadline(cepOrigem, cepDestino);
        break;
      }

      case "sync-tracking": {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: entregas, error: fetchError } = await supabase
          .from("entregas")
          .select("id, nf_remessa, codigo_rastreamento, status, transportadora_id, transportadoras!inner(nome_fantasia)")
          .or("nome_fantasia.ilike.%rodonaves%,nome_fantasia.ilike.%rte%", { referencedTable: "transportadoras" })
          .not("status", "in", '("entregue","finalizado")')
          .not("nf_remessa", "is", null);

        if (fetchError) throw fetchError;

        const cnpjRemetente = params.cnpjRemetente || cnpjDefault;
        const updates: Array<{ id: string; status: string; lastEvent: string }> = [];

        for (const entrega of entregas || []) {
          try {
            const trackingData = await trackShipment({
              taxIdRegistration: cnpjRemetente,
              invoiceNumber: entrega.nf_remessa || "",
            });

            if (trackingData?.Tracking?.length > 0) {
              const latestEvent = trackingData.Tracking[0];
              const newStatus = mapTrackingCodeToStatus(latestEvent.CodigoOcorrencia);
              if (newStatus !== "ocorrencia" && newStatus !== entrega.status) {
                await supabase.from("entregas").update({
                  status: newStatus,
                  ...(newStatus === "entregue" ? { data_entrega_efetiva: new Date().toISOString() } : {}),
                }).eq("id", entrega.id);
                updates.push({ id: entrega.id, status: newStatus, lastEvent: latestEvent.DescricaoOcorrencia });
              }
              if (newStatus === "ocorrencia") {
                await supabase.from("ocorrencias").insert({
                  entrega_id: entrega.id,
                  tipo_ocorrencia: `RTE-${latestEvent.CodigoOcorrencia}`,
                  descricao: latestEvent.DescricaoOcorrencia,
                });
              }
            }
          } catch (trackErr) {
            console.error(`[rodonaves-api] Error tracking entrega ${entrega.id}:`, trackErr);
          }
        }
        result = { synced: updates.length, updates };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders);
    }
    console.error("[rodonaves-api] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

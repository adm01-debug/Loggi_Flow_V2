import { safeFetch } from "../_shared/safeFetch.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { requireString, requireNumber, ValidationError, validationErrorResponse } from "../_shared/validate.ts";
import { getCircuitBreaker } from "../_shared/circuitBreaker.ts";
import { getRedisClient } from "../_shared/redis.ts";
import { log } from "../_shared/logger.ts";


// Rodonaves API Gateways
const TRACKING_GATEWAY = "https://tracking-apigateway.rte.com.br";
const QUOTATION_GATEWAY = "https://quotation-apigateway.rte.com.br";
const DEADLINE_GATEWAY = "https://01wapi.rte.com.br";
const PICKUP_GATEWAY = "https://pickup-apigateway.rte.com.br";
const CUSTOMER_GATEWAY = "https://customer-apigateway.rte.com.br";
const SELFATTENDANCE_GATEWAY = "https://01wapi.rte.com.br";
const UNITTOCITY_GATEWAY = "https://unittocity-apigateway.rte.com.br";
const PAYMENTS_GATEWAY = "https://payments-apigateway.rte.com.br";
const DNE_GATEWAY = "https://dne-apigateway.rte.com.br";

/**
 * Perfis de timeout por gateway (ms), derivados do SLA implícito medido:
 * tracking P95 5s, quotation/customer P95 10s, selfattendance 12s, pickup 15s.
 * Usar um timeout único faz a coleta abortar cedo e o rastreio esperar demais.
 */
const GATEWAY_TIMEOUT: Record<string, number> = {
  [TRACKING_GATEWAY]: 8_000,
  [QUOTATION_GATEWAY]: 14_000,
  [PICKUP_GATEWAY]: 20_000,
  [CUSTOMER_GATEWAY]: 14_000,
  [SELFATTENDANCE_GATEWAY]: 16_000,
  [UNITTOCITY_GATEWAY]: 14_000,
  [PAYMENTS_GATEWAY]: 16_000,
  [DNE_GATEWAY]: 8_000,
};
const DEFAULT_TIMEOUT = 15_000;

function timeoutFor(gateway: string): number {
  return GATEWAY_TIMEOUT[gateway] ?? DEFAULT_TIMEOUT;
}

/** Erro tipado da integração RTE, com classificação de causa. */
class RTEError extends Error {
  constructor(
    message: string,
    readonly code: "RTE_SCOPE_BLOCKED" | "RTE_UPSTREAM_ERROR" | "RTE_TIMEOUT" | "RTE_AUTH_FAILED" | "RTE_BAD_REQUEST",
    readonly httpStatus: number,
    readonly gateway: string,
  ) {
    super(message);
    this.name = "RTEError";
  }
}

function classifyStatus(status: number): RTEError["code"] {
  if (status === 401) return "RTE_AUTH_FAILED";
  if (status === 403) return "RTE_SCOPE_BLOCKED";
  if (status >= 500) return "RTE_UPSTREAM_ERROR";
  return "RTE_BAD_REQUEST";
}

/** Executa um fetch com AbortController respeitando o perfil do gateway. */
async function fetchWithTimeout(
  gateway: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutFor(gateway));
  try {
    return await safeFetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (controller.signal.aborted) {
      throw new RTEError(
        `Timeout de ${timeoutFor(gateway)}ms no gateway ${gateway}`,
        "RTE_TIMEOUT",
        504,
        gateway,
      );
    }
    throw new RTEError(message, "RTE_UPSTREAM_ERROR", 502, gateway);
  } finally {
    clearTimeout(timer);
  }
}


const rodonavesBreaker = getCircuitBreaker('rodonaves', {
  failureThreshold: 10,
  resetTimeout: 60000, // 1 minute
});


// Token cache (in-memory per isolate)
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getToken(gateway: string): Promise<string> {
  const cached = tokenCache[gateway];
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const username = Deno.env.get("RODONAVES_USERNAME");
  const password = Deno.env.get("RODONAVES_PASSWORD");
  if (!username || !password) throw new Error("RODONAVES credentials not configured");

  const response = await fetchWithTimeout(gateway, `${gateway}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ auth_type: "DEV", grant_type: "password", username, password }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new RTEError(`Auth failed [${response.status}]: ${text}`, "RTE_AUTH_FAILED", 502, gateway);
  }
  const data = await response.json();
  // Cache por gateway: cada gateway emite seu próprio token OAuth.
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

// Helper: build query string from params object
function buildQS(params: Record<string, string | number | boolean | undefined>): URLSearchParams {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  return qs;
}

// Helper: authenticated GET
async function apiGet(gateway: string, path: string, params: Record<string, string | number | boolean | undefined> = {}) {
  return await rodonavesBreaker.execute(async () => {
    const token = await getToken(gateway);
    const qs = buildQS(params);
    const url = `${gateway}${path}${qs.toString() ? `?${qs}` : ""}`;
    const res = await safeFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`GET ${path} failed [${res.status}]: ${await res.text()}`);
    return res.json();
  });
}

// Helper: authenticated POST/PUT/DELETE
async function apiMutate(gateway: string, method: string, path: string, body?: unknown, queryParams?: Record<string, string | number | boolean | undefined>) {
  return await rodonavesBreaker.execute(async () => {
    const token = await getToken(gateway);
    const qs = queryParams ? buildQS(queryParams) : new URLSearchParams();
    const url = `${gateway}${path}${qs.toString() ? `?${qs}` : ""}`;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const opts: RequestInit = { method, headers };
    if (body) {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const res = await safeFetch(url, opts);
    if (!res.ok) throw new Error(`${method} ${path} failed [${res.status}]: ${await res.text()}`);
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { raw: text }; }
  });
}


// ==========================================
// TRACKING GATEWAY ACTIONS
// ==========================================

async function trackShipment(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/tracking", {
    TaxIdRegistration: p.taxIdRegistration as string,
    InvoiceNumber: p.invoiceNumber as string,
    InvoiceKey: p.invoiceKey as string,
    ProtocolNumber: p.protocolNumber as string,
    CTeNumber: p.cTeNumber as number,
    IsCustomerPortal: p.isCustomerPortal as boolean,
  });
}

async function trackBatch(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/tracking/batch", {
    TaxIdRegistration: p.taxIdRegistration as string,
    StartDate: p.startDate as string,
    EndDate: p.endDate as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
    OperationType: p.operationType as number,
  });
}

// NEW: Batch with pagination metadata (amountPages, totalRegisters)
async function trackBatchPagination(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/tracking/batchPagination", {
    TaxIdRegistration: p.taxIdRegistration as string,
    StartDate: p.startDate as string,
    EndDate: p.endDate as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
    OperationType: p.operationType as number,
    CTeNumber: p.cTeNumber as number,
  });
}

// NEW: Batch by params (no date required)
async function trackBatchByParams(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/tracking/batchpaginationbyparms", {
    TaxIdRegistration: p.taxIdRegistration as string,
    CTeNumber: p.cTeNumber as number,
    InvoiceNumber: p.invoiceNumber as string,
    ProtocolNumber: p.protocolNumber as string,
    Page: p.page as number,
  });
}

async function trackingSteps(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/tracking/trackingSteps", {
    TaxIdRegistration: p.taxIdRegistration as string,
    InvoiceNumber: p.invoiceNumber as string,
    InvoiceKey: p.invoiceKey as string,
    ProtocolNumber: p.protocolNumber as string,
    CTeNumber: p.cTeNumber as number,
    IsCustomerPortal: p.isCustomerPortal as boolean,
  });
}

// NEW: Batch by occurrence date
async function trackBatchByOccurrenceDate(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/tracking/batchByOccurrenceDate", {
    TaxIdRegistration: p.taxIdRegistration as string,
    StartDate: p.startDate as string,
    EndDate: p.endDate as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
    OperationType: p.operationType as number,
    CTeNumber: p.cTeNumber as number,
  });
}

// DELIVERY RECEIPTS
async function getDeliveryProof(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/deliveryreceipt", {
    TaxIdRegistration: p.taxIdRegistration as string,
    InvoiceNumber: p.invoiceNumber as string,
    InvoiceKey: p.invoiceKey as string,
    ProtocolNumber: p.protocolNumber as string,
    CTeNumber: p.cTeNumber as number,
  });
}

// NEW: High-quality delivery receipt (without image compression)
async function getDeliveryProofHQ(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/deliveryreceipt/withoutImageCompression", {
    TaxIdRegistration: p.taxIdRegistration as string,
    InvoiceNumber: p.invoiceNumber as string,
    InvoiceKey: p.invoiceKey as string,
    ProtocolNumber: p.protocolNumber as string,
    CTeNumber: p.cTeNumber as number,
  });
}

async function getDeliveryInfo(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/deliveryreceipt/deliveryInformation", {
    TaxIdRegistration: p.taxIdRegistration as string,
    InvoiceNumber: p.invoiceNumber as string,
    InvoiceKey: p.invoiceKey as string,
    ProtocolNumber: p.protocolNumber as string,
    CTeNumber: p.cTeNumber as number,
  });
}

// NEW: Batch delivery receipts → returns S3 zip URL
async function getDeliveryReceiptBatch(p: Record<string, unknown>) {
  return apiMutate(TRACKING_GATEWAY, "POST", "/api/v1/deliveryreceipt/receipt-key-list", p.body);
}

// NEW: Batch delivery receipts by protocols array
async function getDeliveryReceiptByProtocols(p: Record<string, unknown>) {
  const protocols = p.protocols as string[];
  const qs = new URLSearchParams();
  protocols?.forEach(proto => qs.append("requestProtocols", proto));
  const token = await getToken(TRACKING_GATEWAY);
  const res = await safeFetch(`${TRACKING_GATEWAY}/api/v1/deliveryreceipt/batchdeliveryreceiptsbyprotocols?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Batch receipts by protocols failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

// NEW: OCCURRENCE RECEIPTS (3 endpoints)
async function getOccurrenceReceipt(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/occurrencereceipt", {
    BillOfLadingId: p.billOfLadingId as number,
    OccurenceCode: p.occurrenceCode as string,
    LoadImageContent: p.loadImageContent as boolean,
  });
}

async function getOccurrenceReceiptList(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/occurrencereceipt/list", {
    BillOfLadingId: p.billOfLadingId as number,
    OccurenceCode: p.occurrenceCode as string,
    LoadImageContent: p.loadImageContent as boolean,
  });
}

async function getOccurrenceReceiptImageUrl(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/occurrencereceipt/imageurl", {
    BillOfLadingId: p.billOfLadingId as number,
    OccurenceCode: p.occurrenceCode as string,
    RemoveImageUrlExpire: p.removeImageUrlExpire as boolean,
  });
}

// ORDERS
async function getOrders(p: Record<string, unknown>) {
  return apiGet(TRACKING_GATEWAY, "/api/v1/orders/ordersbydaterangepagination", {
    TaxIdRegistration: p.taxIdRegistration as string,
    CustomerType: p.customerType as number,
    StartDate: p.startDate as string,
    EndDate: p.endDate as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
    InvoiceNumber: p.invoiceNumber as string,
    CTeNumber: p.cTeNumber as number,
  });
}

// ==========================================
// QUOTATION GATEWAY ACTIONS
// ==========================================

async function simulateQuotation(p: Record<string, unknown>) {
  return apiMutate(QUOTATION_GATEWAY, "POST", "/api/v1/simula-cotacao", {
    CepOrigem: p.cepOrigem, CepDestino: p.cepDestino, Peso: p.peso,
    Volumes: p.volumes, ValorMercadoria: p.valorMercadoria, CnpjRemetente: p.cnpjRemetente,
  });
}

// NEW: Generate actual quotation (creates in TMS)
async function generateQuotation(p: Record<string, unknown>) {
  return apiMutate(QUOTATION_GATEWAY, "POST", "/api/v1/gera-cotacao", p.body);
}

// NEW: Generate first quotation
async function generateFirstQuotation(p: Record<string, unknown>) {
  return apiMutate(QUOTATION_GATEWAY, "POST", "/api/v1/gera-primeira-cotacao", p.body);
}

// NEW: Update quotation contact after creation
async function updateQuotationContact(p: Record<string, unknown>) {
  return apiMutate(QUOTATION_GATEWAY, "PUT", "/api/v1/atualiza-contato-cotacao", p.body);
}

// NEW: Digital carrier quotation
async function generateDigitalCarrierQuotation(p: Record<string, unknown>) {
  return apiMutate(QUOTATION_GATEWAY, "POST", "/api/v1/gera-cotacao-transp-digital", p.body);
}

// NEW: Update NF-e key for quotation
async function updateQuotationInvoiceKey(p: Record<string, unknown>) {
  return apiMutate(QUOTATION_GATEWAY, "PUT", "/api/v1/atualiza-nfe-cotacao", p.body);
}

async function getCubageFactor(taxId: string, companyId?: string) {
  return apiGet(QUOTATION_GATEWAY, "/api/v1/peso-cubado", { taxIdRegistration: taxId, companyId: companyId as string });
}

async function getDeadline(cepOrigem: string, cepDestino: string) {
  return apiMutate(DEADLINE_GATEWAY, "POST", "/api/v1/busca-prazo", { CepOrigem: cepOrigem, CepDestino: cepDestino });
}

// ==========================================
// CUSTOMER GATEWAY ACTIONS (ALL NEW)
// ==========================================

async function saveCustomer(p: Record<string, unknown>) {
  return apiMutate(CUSTOMER_GATEWAY, "POST", "/api/v1/customer/savecustomer", p.body);
}

async function getCustomerById(id: number) {
  return apiGet(CUSTOMER_GATEWAY, `/api/v1/customer/${id}`, {});
}

async function getCustomersByDate(p: Record<string, unknown>) {
  return apiGet(CUSTOMER_GATEWAY, "/api/v1/customer", {
    LastChangedDate: p.lastChangedDate as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
  });
}

async function getCustomerByTaxId(p: Record<string, unknown>) {
  return apiGet(CUSTOMER_GATEWAY, "/api/v1/customer/getbytaxidregistration", {
    TaxIdRegistration: p.taxIdRegistration as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
  });
}

async function getCustomerByDescription(p: Record<string, unknown>) {
  return apiGet(CUSTOMER_GATEWAY, "/api/v1/customer/getbydescription", {
    Key: p.key as string,
    Description: p.description as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
  });
}

async function getCustomerFullByDescription(p: Record<string, unknown>) {
  return apiGet(CUSTOMER_GATEWAY, "/api/v1/customer/getfullbydescription", {
    Key: p.key as string,
    Description: p.description as string,
    Page: p.page as number,
    AmountByPage: p.amountByPage as number,
  });
}

async function getAddressesByTaxId(taxId: string) {
  return apiGet(CUSTOMER_GATEWAY, `/api/v1/address/getbytaxidregistration/${taxId}`, {});
}

async function createAddress(p: Record<string, unknown>) {
  return apiMutate(CUSTOMER_GATEWAY, "POST", "/api/v1/address", p.body);
}

async function updateAddress(p: Record<string, unknown>) {
  return apiMutate(CUSTOMER_GATEWAY, "PUT", "/api/v1/address", p.body);
}

async function deleteAddress(id: number) {
  return apiMutate(CUSTOMER_GATEWAY, "DELETE", `/api/v1/address/${id}`);
}

async function updatePerson(p: Record<string, unknown>) {
  return apiMutate(CUSTOMER_GATEWAY, "PUT", "/api/v1/person", p.body);
}

// ==========================================
// PICKUP GATEWAY ACTIONS (ALL NEW)
// ==========================================

async function getPickupById(id: number) {
  return apiGet(PICKUP_GATEWAY, `/api/v1/pickup/${id}`, {});
}

async function createPickup(p: Record<string, unknown>) {
  return apiMutate(PICKUP_GATEWAY, "POST", "/api/v1/pickup", p.body);
}

async function createPickupByQuotation(p: Record<string, unknown>) {
  return apiMutate(PICKUP_GATEWAY, "POST", "/api/v1/pickup/pickupbyquotationprotocol", p.body);
}

async function getAvailablePickupDates(protocol: number) {
  return apiGet(PICKUP_GATEWAY, "/api/v1/pickup/getavaliablepickupdate", { protocol });
}

async function getAvailablePickupDatesByParams(p: Record<string, unknown>) {
  return apiGet(PICKUP_GATEWAY, "/api/v1/pickup/getavaliablepickupdatebyparms", {
    OriginUnit: p.originUnit as number,
    PersonId: p.personId as number,
    Cep: p.cep as string,
    Address: p.address as string,
    Number: p.number as string,
    Supplement: p.supplement as string,
    District: p.district as string,
    City: p.city as string,
    UnitFederationCode: p.unitFederationCode as string,
  });
}

async function getPickupByProtocol(protocol: number) {
  return apiGet(PICKUP_GATEWAY, "/api/v1/pickup/getpickupbyprotocol", { protocol });
}

async function reschedulePickup(protocol: number, pickupDate: string) {
  return apiMutate(PICKUP_GATEWAY, "PUT", "/api/v1/pickup/updatepickupdatebyprotocol", undefined, { protocol, pickupDate });
}

async function cancelPickup(protocol: number) {
  return apiMutate(PICKUP_GATEWAY, "POST", "/api/v1/pickup/cancelpickupbyprotocol", undefined, { protocol });
}

async function resendExpressPickup(id: number) {
  return apiMutate(PICKUP_GATEWAY, "POST", "/api/v1/pickup/resendrodonavesexpresspickup", undefined, { id });
}

async function pickupRescheduleOrFinalize(p: Record<string, unknown>) {
  return apiMutate(PICKUP_GATEWAY, "POST", "/api/v1/pickup/pickupreschedulingorfinalizingoccurrence", undefined, {
    pickupId: p.pickupId as number,
    writeoffId: p.writeoffId as number,
    writeoffObservation: p.writeoffObservation as string,
    finalizingOccurrence: p.finalizingOccurrence as boolean,
  });
}

async function generateAutomaticPickup(p: Record<string, unknown>) {
  return apiMutate(PICKUP_GATEWAY, "POST", "/webapi/automaticpickup/generateautomaticpickup", p.body);
}

// ==========================================
// SELFATTENDANCE GATEWAY ACTIONS (ALL NEW)
// ==========================================

async function searchCityByDescription(description: string, uf?: string) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/city/description", { description, uf: uf as string });
}

async function searchCityByZipCode(zipCode: string) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/city/zipcode", { zipCode });
}

async function getAddressByZipCode(zipCode: string) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/city/zipcodeaddress", { zipCode });
}

async function trackingStepsBot(p: Record<string, unknown>) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/tracking/v1/tracking-steps-bot", {
    TaxIdRegistration: p.taxIdRegistration as string,
    InvoiceNumber: p.invoiceNumber as string,
    InvoiceKey: p.invoiceKey as string,
    ProtocolNumber: p.protocolNumber as string,
  });
}

async function trackingLastStepsBot(p: Record<string, unknown>) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/tracking/v1/tracking-last-steps-bot", {
    TaxIdRegistration: p.taxIdRegistration as string,
    InvoiceNumber: p.invoiceNumber as string,
    InvoiceKey: p.invoiceKey as string,
    ProtocolNumber: p.protocolNumber as string,
  });
}

async function getUnitData(unitId?: number) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/unit/v1", { unitId: unitId as number });
}

async function getUnitCalendarByProtocol(protocol: number) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/unit/v1/calenderunitbyprotocol", { protocol });
}

async function selfAttendanceQuotation(p: Record<string, unknown>) {
  return apiMutate(SELFATTENDANCE_GATEWAY, "POST", "/webapi/quotation", p.body);
}

async function selfAttendanceDeliveryTime(p: Record<string, unknown>) {
  return apiMutate(SELFATTENDANCE_GATEWAY, "POST", "/webapi/deliverytime", p.body);
}

async function validateCustomerForQuotation(p: Record<string, unknown>) {
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/customer/byvalidquotation", {
    TaxId: p.taxId as string,
    Origin: p.origin as string,
  });
}

// ==========================================
// MAIN HANDLER
// ==========================================

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    const rl = await checkRateLimit(req, "rodonaves-api", { maxRequests: 30 });
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
      // ===== TRACKING =====
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
          startDate, endDate,
          page: params.page, amountByPage: params.amountByPage || 50,
        });
        break;
      }

      case "track-batch-paginated": {
        const taxId = requireString(params, "cnpjRemetente", { minLength: 11 });
        const startDate = requireString(params, "startDate");
        const endDate = requireString(params, "endDate");
        result = await trackBatchPagination({
          taxIdRegistration: taxId || cnpjDefault,
          startDate, endDate,
          page: params.page, amountByPage: params.amountByPage || 50,
          operationType: params.operationType, cTeNumber: params.cTeNumber,
        });
        break;
      }

      case "track-batch-by-params": {
        const taxId = requireString(params, "cnpjRemetente", { minLength: 11 });
        result = await trackBatchByParams({
          taxIdRegistration: taxId || cnpjDefault,
          cTeNumber: params.cTeNumber,
          invoiceNumber: params.nfNumero,
          protocolNumber: params.protocolNumber,
          page: params.page,
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

      case "track-batch-by-occurrence": {
        const taxId = requireString(params, "cnpjRemetente", { minLength: 11 });
        const startDate = requireString(params, "startDate");
        const endDate = requireString(params, "endDate");
        result = await trackBatchByOccurrenceDate({
          taxIdRegistration: taxId || cnpjDefault,
          startDate, endDate,
          page: params.page, amountByPage: params.amountByPage || 50,
          operationType: params.operationType, cTeNumber: params.cTeNumber,
        });
        break;
      }

      // ===== DELIVERY RECEIPTS =====
      case "delivery-proof": {
        result = await getDeliveryProof({
          taxIdRegistration: params.cnpjRemetente || cnpjDefault,
          invoiceNumber: params.nfNumero,
          invoiceKey: params.invoiceKey,
          protocolNumber: params.protocolNumber,
        });
        break;
      }

      case "delivery-proof-hq": {
        result = await getDeliveryProofHQ({
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

      case "delivery-receipt-batch": {
        result = await getDeliveryReceiptBatch({ body: params.body });
        break;
      }

      case "delivery-receipt-by-protocols": {
        result = await getDeliveryReceiptByProtocols({ protocols: params.protocols });
        break;
      }

      // ===== OCCURRENCE RECEIPTS =====
      case "occurrence-receipt": {
        const billId = requireNumber(params, "billOfLadingId", { min: 1 });
        const code = requireString(params, "occurrenceCode");
        result = await getOccurrenceReceipt({ billOfLadingId: billId, occurrenceCode: code, loadImageContent: params.loadImageContent });
        break;
      }

      case "occurrence-receipt-list": {
        const billId = requireNumber(params, "billOfLadingId", { min: 1 });
        const code = requireString(params, "occurrenceCode");
        result = await getOccurrenceReceiptList({ billOfLadingId: billId, occurrenceCode: code, loadImageContent: params.loadImageContent });
        break;
      }

      case "occurrence-receipt-image": {
        const billId = requireNumber(params, "billOfLadingId", { min: 1 });
        const code = requireString(params, "occurrenceCode");
        result = await getOccurrenceReceiptImageUrl({ billOfLadingId: billId, occurrenceCode: code, removeImageUrlExpire: params.removeImageUrlExpire });
        break;
      }

      // ===== ORDERS =====
      case "orders": {
        const taxId = requireString(params, "cnpjRemetente", { minLength: 11 });
        const startDate = requireString(params, "startDate");
        const endDate = requireString(params, "endDate");
        result = await getOrders({
          taxIdRegistration: taxId || cnpjDefault,
          customerType: params.customerType ?? 1,
          startDate, endDate,
          page: params.page, amountByPage: params.amountByPage || 20,
          invoiceNumber: params.invoiceNumber, cTeNumber: params.cTeNumber,
        });
        break;
      }

      // ===== QUOTATION =====
      case "quotation": {
        const cepOrigem = requireString(params, "cepOrigem", { pattern: /^\d{5}-?\d{3}$/ });
        const cepDestino = requireString(params, "cepDestino", { pattern: /^\d{5}-?\d{3}$/ });
        const peso = requireNumber(params, "peso", { min: 0.01, max: 100000 });
        const volumes = requireNumber(params, "volumes", { min: 1, max: 10000 });
        const valorMercadoria = requireNumber(params, "valorMercadoria", { min: 0 });
        
        // Try cache first
        const redis = getRedisClient();
        const cacheKey = `rodonaves_quote_${cepOrigem}_${cepDestino}_${peso}_${volumes}_${valorMercadoria}`;
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            log.info(`[Cache] Cache hit for ${cacheKey}`);
            return corsResponse(cached, { 'X-Cache': 'HIT' });
          }
        }

        result = await simulateQuotation({
          cepOrigem, cepDestino, peso, volumes, valorMercadoria,
          cnpjRemetente: params.cnpjRemetente || cnpjDefault,
        });

        // Store in cache
        if (redis) {
          await redis.set(cacheKey, result, { ex: 600 }); // 10 minutes
        }
        
        // Return with cache miss header if we have result
        if (result) {
          return corsResponse(result, { 'X-Cache': 'MISS' });
        }
        break;
      }


      case "generate-quotation": {
        result = await generateQuotation({ body: params.body });
        break;
      }

      case "generate-first-quotation": {
        result = await generateFirstQuotation({ body: params.body });
        break;
      }

      case "update-quotation-contact": {
        result = await updateQuotationContact({ body: params.body });
        break;
      }

      case "digital-carrier-quotation": {
        result = await generateDigitalCarrierQuotation({ body: params.body });
        break;
      }

      case "update-quotation-invoice-key": {
        result = await updateQuotationInvoiceKey({ body: params.body });
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

      // ===== CUSTOMER =====
      case "customer-save": {
        result = await saveCustomer({ body: params.body });
        break;
      }

      case "customer-get-by-id": {
        const id = requireNumber(params, "id", { min: 1 });
        result = await getCustomerById(id);
        break;
      }

      case "customer-list": {
        const lastDate = requireString(params, "lastChangedDate");
        result = await getCustomersByDate({ lastChangedDate: lastDate, page: params.page, amountByPage: params.amountByPage || 20 });
        break;
      }

      case "customer-get-by-taxid": {
        const taxId = requireString(params, "taxIdRegistration", { minLength: 11 });
        result = await getCustomerByTaxId({ taxIdRegistration: taxId, page: params.page, amountByPage: params.amountByPage || 20 });
        break;
      }

      case "customer-search": {
        result = await getCustomerByDescription({ key: params.key, description: params.description, page: params.page, amountByPage: params.amountByPage || 20 });
        break;
      }

      case "customer-search-full": {
        result = await getCustomerFullByDescription({ key: params.key, description: params.description, page: params.page, amountByPage: params.amountByPage || 20 });
        break;
      }

      case "address-list": {
        const taxId = requireString(params, "taxIdRegistration", { minLength: 11 });
        result = await getAddressesByTaxId(taxId);
        break;
      }

      case "address-create": {
        result = await createAddress({ body: params.body });
        break;
      }

      case "address-update": {
        result = await updateAddress({ body: params.body });
        break;
      }

      case "address-delete": {
        const id = requireNumber(params, "id", { min: 1 });
        result = await deleteAddress(id);
        break;
      }

      case "person-update": {
        result = await updatePerson({ body: params.body });
        break;
      }

      // ===== PICKUP =====
      case "pickup-get": {
        const id = requireNumber(params, "id", { min: 1 });
        result = await getPickupById(id);
        break;
      }

      case "pickup-create": {
        result = await createPickup({ body: params.body });
        break;
      }

      case "pickup-create-by-quotation": {
        result = await createPickupByQuotation({ body: params.body });
        break;
      }

      case "pickup-available-dates": {
        const protocol = requireNumber(params, "protocol", { min: 1 });
        result = await getAvailablePickupDates(protocol);
        break;
      }

      case "pickup-available-dates-by-params": {
        result = await getAvailablePickupDatesByParams(params);
        break;
      }

      case "pickup-get-by-protocol": {
        const protocol = requireNumber(params, "protocol", { min: 1 });
        result = await getPickupByProtocol(protocol);
        break;
      }

      case "pickup-reschedule": {
        const protocol = requireNumber(params, "protocol", { min: 1 });
        const pickupDate = requireString(params, "pickupDate");
        result = await reschedulePickup(protocol, pickupDate);
        break;
      }

      case "pickup-cancel": {
        const protocol = requireNumber(params, "protocol", { min: 1 });
        result = await cancelPickup(protocol);
        break;
      }

      case "pickup-resend-express": {
        const id = requireNumber(params, "id", { min: 1 });
        result = await resendExpressPickup(id);
        break;
      }

      case "pickup-reschedule-or-finalize": {
        result = await pickupRescheduleOrFinalize(params);
        break;
      }

      case "pickup-automatic": {
        result = await generateAutomaticPickup({ body: params.body });
        break;
      }

      // ===== SELFATTENDANCE =====
      case "city-search": {
        const description = requireString(params, "description");
        result = await searchCityByDescription(description, params.uf);
        break;
      }

      case "city-by-zipcode": {
        const zipCode = requireString(params, "zipCode");
        result = await searchCityByZipCode(zipCode);
        break;
      }

      case "address-by-zipcode": {
        const zipCode = requireString(params, "zipCode");
        result = await getAddressByZipCode(zipCode);
        break;
      }

      case "tracking-steps-bot": {
        result = await trackingStepsBot({
          taxIdRegistration: params.cnpjRemetente || cnpjDefault,
          invoiceNumber: params.nfNumero,
          invoiceKey: params.invoiceKey,
          protocolNumber: params.protocolNumber,
        });
        break;
      }

      case "tracking-last-steps-bot": {
        result = await trackingLastStepsBot({
          taxIdRegistration: params.cnpjRemetente || cnpjDefault,
          invoiceNumber: params.nfNumero,
          invoiceKey: params.invoiceKey,
          protocolNumber: params.protocolNumber,
        });
        break;
      }

      case "unit-data": {
        result = await getUnitData(params.unitId);
        break;
      }

      case "unit-calendar": {
        const protocol = requireNumber(params, "protocol", { min: 1 });
        result = await getUnitCalendarByProtocol(protocol);
        break;
      }

      case "self-attendance-quotation": {
        result = await selfAttendanceQuotation({ body: params.body });
        break;
      }

      case "self-attendance-delivery-time": {
        result = await selfAttendanceDeliveryTime({ body: params.body });
        break;
      }

      case "validate-customer-quotation": {
        result = await validateCustomerForQuotation({ taxId: params.taxId, origin: params.origin });
        break;
      }

      // ===== SYNC =====
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
            log.error(`[rodonaves-api] Error tracking entrega ${entrega.id}:`, trackErr);
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
    log.error("[rodonaves-api] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

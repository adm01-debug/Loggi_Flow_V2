/**
 * Matriz de capacidades da API Rodonaves para o CNPJ da operação.
 *
 * Alinhada à documentação do MCP Rodonaves v6.9.0 (02/05/2026): o escopo
 * *consumer* está liberado, enquanto o escopo de *gestão interna* (CRUD de
 * clientes, ocorrências internas, calendário de unidade) responde 403.
 * Toda rota bloqueada aponta em `fallback` a alternativa liberada que o
 * gateway `rodonaves-api` usa no lugar dela. O gateway DNE está offline
 * desde abril/2026 e possui cadeia de fallback dedicada (ViaCEP/IBGE).
 *
 * A UI consulta esta matriz para desabilitar e explicar ações indisponíveis
 * em vez de disparar chamadas que falham em runtime.
 */

export type RTEGateway =
  | "quotation"
  | "tracking"
  | "pickup"
  | "customer"
  | "selfattendance"
  | "dne"
  | "payments"
  | "unittocity";

export type RTECapabilityStatus =
  "liberado" | "bloqueado" | "offline" | "instavel" | "nao_testado";

export interface RTECapability {
  readonly action: string;
  readonly gateway: RTEGateway;
  readonly status: RTECapabilityStatus;
  /** Explicação exibida ao operador quando a ação não está disponível. */
  readonly note?: string;
  /** Ação liberada a ser usada no lugar desta (rota alternativa). */
  readonly fallback?: string;
}

/** Rótulos de status para exibição. */
export const CAPABILITY_STATUS_LABELS: Readonly<
  Record<RTECapabilityStatus, string>
> = {
  liberado: "Disponível",
  bloqueado: "Bloqueado pela transportadora (403)",
  offline: "Gateway indisponível",
  instavel: "Instável — erro intermitente na RTE",
  nao_testado: "Não validado em produção",
};

/** Perfis de latência observados por gateway (P50/P95 em milissegundos). */
export const GATEWAY_LATENCY: Readonly<
  Record<RTEGateway, { readonly p50: number; readonly p95: number }>
> = {
  tracking: { p50: 2000, p95: 5000 },
  quotation: { p50: 4000, p95: 10000 },
  pickup: { p50: 6000, p95: 15000 },
  customer: { p50: 4000, p95: 10000 },
  selfattendance: { p50: 5000, p95: 12000 },
  payments: { p50: 5000, p95: 12000 },
  unittocity: { p50: 4000, p95: 10000 },
  dne: { p50: 9000, p95: 9000 },
};

const CAPABILITIES: readonly RTECapability[] = [
  // ---------- tracking ----------
  { action: "track", gateway: "tracking", status: "liberado" },
  { action: "track-batch", gateway: "tracking", status: "liberado" },
  {
    action: "track-batch-paginated",
    gateway: "tracking",
    status: "bloqueado",
    note: "batchPagination responde 403 (sem permissão).",
    fallback: "track-batch",
  },
  { action: "track-batch-by-params", gateway: "tracking", status: "liberado" },
  {
    action: "track-batch-by-occurrence",
    gateway: "tracking",
    status: "liberado",
  },
  { action: "tracking-steps", gateway: "tracking", status: "liberado" },
  { action: "delivery-proof", gateway: "tracking", status: "liberado" },
  {
    action: "delivery-proof-hq",
    gateway: "tracking",
    status: "bloqueado",
    note: "Comprovante sem compressão responde 403 (sem permissão).",
    fallback: "delivery-proof",
  },
  {
    action: "delivery-info",
    gateway: "tracking",
    status: "bloqueado",
    note: "deliveryInformation responde 403 (sem permissão).",
    fallback: "tracking-steps",
  },
  {
    action: "delivery-receipt-batch",
    gateway: "tracking",
    status: "bloqueado",
    note: "receipt-key-list responde 403 (sem permissão).",
    fallback: "delivery-receipt-by-protocols",
  },
  {
    action: "delivery-receipt-by-protocols",
    gateway: "tracking",
    status: "bloqueado",
    note: "batchdeliveryreceiptsbyprotocols responde 403 (sem permissão).",
    fallback: "delivery-proof",
  },
  {
    action: "occurrence-receipt",
    gateway: "tracking",
    status: "bloqueado",
    note: "Comprovante de ocorrência pertence ao escopo de operação interna.",
  },
  {
    action: "occurrence-receipt-list",
    gateway: "tracking",
    status: "bloqueado",
  },
  {
    action: "occurrence-receipt-image",
    gateway: "tracking",
    status: "bloqueado",
  },
  {
    action: "orders",
    gateway: "tracking",
    status: "bloqueado",
    note: "ordersbydaterangepagination responde 403 (sem permissão).",
    fallback: "track-batch",
  },
  { action: "sync-tracking", gateway: "tracking", status: "liberado" },
  { action: "resolve-address", gateway: "tracking", status: "liberado" },

  // ---------- quotation ----------
  { action: "quotation", gateway: "quotation", status: "liberado" },
  {
    action: "generate-quotation",
    gateway: "quotation",
    status: "instavel",
    note: "Gera protocolo permanente, mas apresenta inconsistências na RTE.",
  },
  {
    action: "generate-first-quotation",
    gateway: "quotation",
    status: "instavel",
    note: "Endpoint retorna HTTP 500 na RTE (bug do servidor).",
  },
  {
    action: "digital-carrier-quotation",
    gateway: "quotation",
    status: "nao_testado",
  },
  {
    action: "update-quotation-contact",
    gateway: "quotation",
    status: "nao_testado",
  },
  {
    action: "update-quotation-invoice-key",
    gateway: "quotation",
    status: "nao_testado",
  },
  { action: "cubage-factor", gateway: "quotation", status: "liberado" },
  { action: "deadline", gateway: "quotation", status: "liberado" },
  {
    action: "validate-customer-quotation",
    gateway: "quotation",
    status: "nao_testado",
  },

  // ---------- pickup ----------
  { action: "pickup-get", gateway: "pickup", status: "liberado" },
  { action: "pickup-get-by-protocol", gateway: "pickup", status: "liberado" },
  { action: "pickup-available-dates", gateway: "pickup", status: "liberado" },
  {
    action: "pickup-available-dates-by-params",
    gateway: "pickup",
    status: "bloqueado",
    note: "getavaliablepickupdatebyparms responde 403 (sem permissão).",
    fallback: "pickup-available-dates",
  },
  { action: "pickup-create", gateway: "pickup", status: "nao_testado" },
  {
    action: "pickup-create-by-quotation",
    gateway: "pickup",
    status: "nao_testado",
  },
  { action: "pickup-reschedule", gateway: "pickup", status: "nao_testado" },
  { action: "pickup-cancel", gateway: "pickup", status: "nao_testado" },
  {
    action: "pickup-reschedule-or-finalize",
    gateway: "pickup",
    status: "nao_testado",
  },
  { action: "pickup-automatic", gateway: "pickup", status: "nao_testado" },
  {
    action: "pickup-resend-express",
    gateway: "pickup",
    status: "bloqueado",
    note: "Coleta Express requer liberação de escopo junto ao comercial RTE.",
  },

  // ---------- customer (escopo de gestão interna) ----------
  {
    action: "customer-save",
    gateway: "customer",
    status: "bloqueado",
    note: "CRUD de clientes é escopo de operação interna da RTE.",
  },
  { action: "customer-get-by-id", gateway: "customer", status: "bloqueado" },
  { action: "customer-list", gateway: "customer", status: "bloqueado" },
  {
    action: "customer-get-by-taxid",
    gateway: "customer",
    status: "liberado",
    note: "Única rota de cliente liberada: consulta por CNPJ/CPF (getbytaxidregistration).",
  },
  { action: "customer-search", gateway: "customer", status: "bloqueado" },
  { action: "customer-search-full", gateway: "customer", status: "bloqueado" },
  { action: "address-list", gateway: "customer", status: "bloqueado" },
  { action: "address-create", gateway: "customer", status: "bloqueado" },
  { action: "address-update", gateway: "customer", status: "bloqueado" },
  { action: "address-delete", gateway: "customer", status: "bloqueado" },
  { action: "person-update", gateway: "customer", status: "bloqueado" },

  // ---------- selfattendance ----------
  {
    action: "city-search",
    gateway: "selfattendance",
    status: "bloqueado",
    note: "city/description responde 403 (sem permissão).",
    fallback: "city-by-zipcode",
  },
  { action: "city-by-zipcode", gateway: "selfattendance", status: "liberado" },
  {
    action: "address-by-zipcode",
    gateway: "selfattendance",
    status: "bloqueado",
    note: "city/zipcodeaddress responde 403 (sem permissão).",
    fallback: "resolve-address",
  },
  {
    action: "tracking-steps-bot",
    gateway: "selfattendance",
    status: "bloqueado",
    note: "tracking-steps-bot responde 403 (sem permissão).",
    fallback: "tracking-steps",
  },
  {
    action: "tracking-last-steps-bot",
    gateway: "selfattendance",
    status: "bloqueado",
    note: "tracking-last-steps-bot responde 403 (sem permissão).",
    fallback: "tracking-steps",
  },
  { action: "unit-data", gateway: "selfattendance", status: "liberado" },
  {
    action: "unit-calendar",
    gateway: "selfattendance",
    status: "bloqueado",
    note: "calenderunitbyprotocol responde 403 (sem permissão).",
  },
  {
    action: "self-attendance-quotation",
    gateway: "selfattendance",
    status: "bloqueado",
    note: "nova-cotacao (SelfAttendance) responde 403 (sem permissão).",
    fallback: "quotation",
  },
  {
    action: "self-attendance-delivery-time",
    gateway: "selfattendance",
    status: "liberado",
  },

  // ---------- unittocity ----------
  { action: "unit-to-city", gateway: "unittocity", status: "liberado" },
  { action: "check-coverage", gateway: "unittocity", status: "liberado" },

  // ---------- meta ----------
  { action: "health-all", gateway: "tracking", status: "liberado" },
];

const CAPABILITY_INDEX: ReadonlyMap<string, RTECapability> = new Map(
  CAPABILITIES.map((capability) => [capability.action, capability]),
);

/** Lista completa (imutável) das capacidades mapeadas. */
export function listCapabilities(): readonly RTECapability[] {
  return CAPABILITIES;
}

/** Busca a capacidade de uma ação. Retorna null se não mapeada. */
export function getCapability(action: string): RTECapability | null {
  return CAPABILITY_INDEX.get(action) ?? null;
}

/**
 * Indica se a ação pode ser disparada. Ações não mapeadas são consideradas
 * disponíveis (fail-open) para não bloquear evoluções da edge function.
 */
export function isActionAvailable(action: string): boolean {
  const capability = getCapability(action);
  if (!capability) return true;
  return (
    capability.status === "liberado" || capability.status === "nao_testado"
  );
}

/** Mensagem explicativa para o operador quando a ação está indisponível. */
export function capabilityReason(action: string): string | null {
  const capability = getCapability(action);
  if (!capability || isActionAvailable(action)) return null;
  return capability.note ?? CAPABILITY_STATUS_LABELS[capability.status];
}

/** Agrupa as capacidades por gateway, para painéis de diagnóstico. */
export function capabilitiesByGateway(): Record<RTEGateway, RTECapability[]> {
  const grouped = {} as Record<RTEGateway, RTECapability[]>;
  for (const capability of CAPABILITIES) {
    grouped[capability.gateway] ??= [];
    grouped[capability.gateway].push(capability);
  }
  return grouped;
}

export interface CapabilityCoverage {
  readonly total: number;
  readonly liberado: number;
  readonly bloqueado: number;
  readonly offline: number;
  readonly instavel: number;
  readonly naoTestado: number;
  /** Percentual (0-100) de ações efetivamente liberadas. */
  readonly coverageRate: number;
}

/** Resumo quantitativo da matriz — usado no painel de saúde. */
export function capabilityCoverage(): CapabilityCoverage {
  const count = (status: RTECapabilityStatus) =>
    CAPABILITIES.filter((c) => c.status === status).length;

  const total = CAPABILITIES.length;
  const liberado = count("liberado");

  return {
    total,
    liberado,
    bloqueado: count("bloqueado"),
    offline: count("offline"),
    instavel: count("instavel"),
    naoTestado: count("nao_testado"),
    coverageRate: total === 0 ? 0 : Math.round((liberado / total) * 1000) / 10,
  };
}

/**
 * Dicionário canônico de eventos de rastreio Rodonaves (RTE).
 *
 * A API RTE expõe DOIS sistemas paralelos e independentes de códigos:
 *
 *  1. `EventCode` + `ProcedaCode` — retornado por `/api/v1/tracking` e
 *     `/api/v1/tracking/batch`. O `EventCode` admite subníveis decimais
 *     (ex.: "1.1") e o `ProcedaCode` segue o padrão Proceda de ocorrências.
 *  2. `StepCode` — retornado por `/api/v1/tracking/steps` (série 200).
 *
 * Os sistemas são equivalentes em significado, porém **não devem ser
 * misturados na mesma automação**: a granularidade e a semântica de exceção
 * divergem. Por isso o normalizador exige que a origem seja declarada.
 */

/** Fase canônica do ciclo de vida de um frete. */
export type RTEPhase =
  | "coletado"
  | "transferencia"
  | "distribuicao"
  | "no_destino"
  | "em_rota"
  | "entregue"
  | "desconhecido";

/** Categoria de exceção derivada do ProcedaCode (padrão Proceda). */
export type RTEExceptionCategory =
  | "tentativa"
  | "recusa"
  | "estabelecimento_fechado"
  | "endereco_nao_localizado"
  | "pessoa_nao_localizada"
  | "aguardando_retirada"
  | "avaria"
  | "extravio"
  | "reagendado"
  | "devolucao"
  | "parcial";

/** Severidade operacional associada a um evento normalizado. */
export type RTESeverity = "info" | "atencao" | "critico";

/** Sistema de códigos de origem do evento. Nunca deve ser inferido. */
export type RTECodeSystem = "event" | "step";

export interface RTERawEvent {
  /** Sistema de origem do evento (obrigatório — evita mistura de sistemas). */
  readonly system: RTECodeSystem;
  /** EventCode (system "event"). Aceita subníveis decimais como "1.1". */
  readonly eventCode?: string | number | null;
  /** ProcedaCode (system "event"). */
  readonly procedaCode?: string | number | null;
  /** StepCode (system "step"). */
  readonly stepCode?: string | number | null;
  /** Descrição textual devolvida pela API (opcional). */
  readonly description?: string | null;
  /** Data ISO do evento (opcional). */
  readonly date?: string | null;
}

export interface RTENormalizedEvent {
  readonly system: RTECodeSystem;
  readonly phase: RTEPhase;
  readonly exception: RTEExceptionCategory | null;
  readonly severity: RTESeverity;
  readonly isFinal: boolean;
  readonly label: string;
  readonly rawCode: string;
  readonly date: string | null;
}

/** Rótulos legíveis por fase. */
export const PHASE_LABELS: Readonly<Record<RTEPhase, string>> = {
  coletado: "Coletado pela transportadora",
  transferencia: "Em transferência",
  distribuicao: "Em distribuição",
  no_destino: "Na unidade de destino",
  em_rota: "Em rota de entrega",
  entregue: "Entrega finalizada",
  desconhecido: "Status não mapeado",
};

/** Rótulos legíveis por categoria de exceção. */
export const EXCEPTION_LABELS: Readonly<
  Record<RTEExceptionCategory, string>
> = {
  tentativa: "Tentativa de entrega sem sucesso",
  recusa: "Recusa do destinatário",
  estabelecimento_fechado: "Estabelecimento fechado",
  endereco_nao_localizado: "Endereço não localizado",
  pessoa_nao_localizada: "Pessoa não localizada",
  aguardando_retirada: "Aguardando retirada no balcão",
  avaria: "Avaria na mercadoria",
  extravio: "Extravio",
  reagendado: "Entrega reagendada",
  devolucao: "Devolvido ao remetente",
  parcial: "Entrega parcial",
};

/** Severidade de cada categoria de exceção. */
const EXCEPTION_SEVERITY: Readonly<
  Record<RTEExceptionCategory, RTESeverity>
> = {
  tentativa: "atencao",
  recusa: "atencao",
  estabelecimento_fechado: "atencao",
  endereco_nao_localizado: "atencao",
  pessoa_nao_localizada: "atencao",
  aguardando_retirada: "atencao",
  avaria: "critico",
  extravio: "critico",
  reagendado: "atencao",
  devolucao: "critico",
  parcial: "atencao",
};

/**
 * EventCode → fase canônica (validado empiricamente em 5 meses de tracking).
 * Subníveis decimais são tratados explicitamente; o fallback usa o nível raiz.
 */
const EVENT_CODE_PHASE: Readonly<Record<string, RTEPhase>> = {
  "0": "coletado",
  "1": "transferencia",
  "1.1": "distribuicao",
  "2": "no_destino",
  "3": "em_rota",
  "6": "entregue",
};

/**
 * ProcedaCode → categoria de exceção (padrão Proceda).
 * Os códigos 0, 1, 98 e 99 são operacionais (não são exceção).
 */
const PROCEDA_EXCEPTION: Readonly<Record<string, RTEExceptionCategory>> = {
  "2": "tentativa",
  "3": "recusa",
  "4": "estabelecimento_fechado",
  "5": "endereco_nao_localizado",
  "6": "pessoa_nao_localizada",
  "7": "aguardando_retirada",
  "8": "avaria",
  "9": "extravio",
  "10": "reagendado",
  "11": "devolucao",
  "12": "parcial",
};

/** ProcedaCodes operacionais que jamais devem virar exceção. */
const PROCEDA_OPERATIONAL = new Set(["0", "1", "98", "99"]);

/** StepCode (série 200) → fase canônica. */
const STEP_CODE_PHASE: Readonly<Record<string, RTEPhase>> = {
  "204": "coletado",
  "205": "transferencia",
  "209": "no_destino",
  "206": "em_rota",
  "1": "entregue",
};

/** Decodificação do campo TypeUnity presente no sistema de steps. */
export const TYPE_UNITY_LABELS: Readonly<Record<string, string>> = {
  "": "Operação local na filial",
  CTC: "Centro de Triagem Centralizada",
  FRQ: "Frequência (rota fixa entre hubs)",
};

/** Normaliza um código cru para string comparável ("1.10" → "1.1"). */
export function normalizeCode(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (text === "") return "";
  if (!/^\d+(\.\d+)?$/.test(text)) return text;
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return text;
  // Remove zeros à direita mantendo o subnível (ex.: "1.10" → "1.1").
  return String(numeric);
}

/** Resolve a fase a partir de um EventCode, considerando subníveis. */
export function phaseFromEventCode(
  eventCode: string | number | null | undefined,
): RTEPhase {
  const code = normalizeCode(eventCode);
  if (code === "") return "desconhecido";
  const direct = EVENT_CODE_PHASE[code];
  if (direct) return direct;
  const root = code.split(".")[0];
  return EVENT_CODE_PHASE[root] ?? "desconhecido";
}

/** Resolve a fase a partir de um StepCode. */
export function phaseFromStepCode(
  stepCode: string | number | null | undefined,
): RTEPhase {
  const code = normalizeCode(stepCode);
  if (code === "") return "desconhecido";
  return STEP_CODE_PHASE[code] ?? "desconhecido";
}

/** Resolve a categoria de exceção a partir de um ProcedaCode. */
export function exceptionFromProcedaCode(
  procedaCode: string | number | null | undefined,
): RTEExceptionCategory | null {
  const code = normalizeCode(procedaCode);
  if (code === "" || PROCEDA_OPERATIONAL.has(code)) return null;
  return PROCEDA_EXCEPTION[code] ?? null;
}

/**
 * Normaliza um evento cru da API RTE em um evento canônico.
 * O sistema de códigos precisa ser declarado — jamais é inferido — para
 * impedir que EventCode e StepCode sejam misturados numa mesma automação.
 */
export function normalizeRTEEvent(raw: RTERawEvent): RTENormalizedEvent {
  const isStep = raw.system === "step";

  const phase = isStep
    ? phaseFromStepCode(raw.stepCode)
    : phaseFromEventCode(raw.eventCode);

  // Exceções só existem no sistema EventCode/ProcedaCode.
  const exception = isStep ? null : exceptionFromProcedaCode(raw.procedaCode);

  const rawCode = isStep
    ? normalizeCode(raw.stepCode)
    : [normalizeCode(raw.eventCode), normalizeCode(raw.procedaCode)]
        .filter((part) => part !== "")
        .join("/");

  const severity: RTESeverity = exception
    ? EXCEPTION_SEVERITY[exception]
    : "info";

  const description = raw.description?.trim();
  const label =
    exception !== null
      ? EXCEPTION_LABELS[exception]
      : description && description.length > 0
        ? description
        : PHASE_LABELS[phase];

  return {
    system: raw.system,
    phase,
    exception,
    severity,
    isFinal: phase === "entregue" && exception === null,
    label,
    rawCode,
    date: raw.date ?? null,
  };
}

/**
 * Normaliza uma lista de eventos garantindo homogeneidade de sistema.
 * Eventos de sistema divergente do primeiro item são descartados.
 */
export function normalizeRTEEvents(
  events: readonly RTERawEvent[],
): RTENormalizedEvent[] {
  if (events.length === 0) return [];
  const system = events[0].system;
  return events
    .filter((event) => event.system === system)
    .map((event) => normalizeRTEEvent(event));
}

/** Retorna o último evento normalizado (por ordem do array). */
export function lastNormalizedEvent(
  events: readonly RTERawEvent[],
): RTENormalizedEvent | null {
  const normalized = normalizeRTEEvents(events);
  return normalized.length > 0 ? normalized[normalized.length - 1] : null;
}

/** Indica se a lista de eventos representa um frete já entregue. */
export function isDelivered(events: readonly RTERawEvent[]): boolean {
  return normalizeRTEEvents(events).some((event) => event.isFinal);
}

/** Extrai todas as exceções encontradas na trilha de eventos. */
export function collectExceptions(
  events: readonly RTERawEvent[],
): RTENormalizedEvent[] {
  return normalizeRTEEvents(events).filter((event) => event.exception !== null);
}

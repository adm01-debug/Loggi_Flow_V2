/**
 * Motor de anomalias de frete Rodonaves.
 *
 * Implementa as três regras de negócio derivadas do mapa de EventCodes:
 *  - EM ANDAMENTO: ausência de evento final (EventCode 6 / ProcedaCode 1).
 *  - ATRASADO: dias úteis decorridos desde a emissão > prazo previsto,
 *    sem evento final.
 *  - PARADO: mais de N horas (padrão 48) sem novo evento — exceto quando o
 *    último evento é `no_destino` (EventCode 2), que pode aguardar
 *    legitimamente uma entrega agendada.
 */

import {
  collectExceptions,
  lastNormalizedEvent,
  normalizeRTEEvents,
  type RTENormalizedEvent,
  type RTERawEvent,
  type RTESeverity,
} from "./eventCodes";

export interface FreightSnapshot {
  /** Identificador do frete (protocolo, NF ou CT-e). */
  readonly id: string;
  /** Data ISO de emissão. */
  readonly emissionDate: string;
  /** Prazo previsto em dias úteis, conforme retorno da RTE. */
  readonly expectedDeliveryDays: number;
  /** Trilha de eventos crus, homogênea em sistema de códigos. */
  readonly events: readonly RTERawEvent[];
}

export type FreightAnomaly = "atrasado" | "parado" | "excecao";

export interface FreightHealth {
  readonly id: string;
  readonly inProgress: boolean;
  readonly delivered: boolean;
  readonly businessDaysElapsed: number;
  readonly businessDaysOverdue: number;
  readonly hoursSinceLastEvent: number | null;
  readonly anomalies: readonly FreightAnomaly[];
  readonly severity: RTESeverity;
  readonly lastEvent: RTENormalizedEvent | null;
  readonly exceptions: readonly RTENormalizedEvent[];
}

export interface FreightHealthOptions {
  /** Momento de referência (default: agora). Injetável para testes. */
  readonly now?: Date;
  /** Limite em horas para considerar o frete parado (default 48). */
  readonly stalledHours?: number;
  /** Feriados nacionais em formato "YYYY-MM-DD" a excluir da contagem. */
  readonly holidays?: readonly string[];
}

const DEFAULT_STALLED_HOURS = 48;

/** Feriados nacionais fixos (mês-dia) — independentes do ano. */
const FIXED_NATIONAL_HOLIDAYS = new Set([
  "01-01",
  "04-21",
  "05-01",
  "09-07",
  "10-12",
  "11-02",
  "11-15",
  "11-20",
  "12-25",
]);

function toUTCDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function isHoliday(date: Date, holidays: ReadonlySet<string>): boolean {
  const key = toUTCDateKey(date);
  if (holidays.has(key)) return true;
  return FIXED_NATIONAL_HOLIDAYS.has(key.slice(5));
}

/**
 * Conta dias úteis entre duas datas (exclusivo no fim), pulando fins de
 * semana e feriados. Retorna 0 quando `end` <= `start`.
 */
export function businessDaysBetween(
  start: Date,
  end: Date,
  holidays: readonly string[] = [],
): number {
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end.getTime() <= start.getTime()
  ) {
    return 0;
  }

  const holidaySet = new Set(holidays);
  let count = 0;
  const cursor = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    ),
  );
  const limit = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );

  // Guarda de segurança: no máximo 10 anos de iteração.
  let guard = 0;
  while (cursor.getTime() < limit.getTime() && guard < 3660) {
    if (!isWeekend(cursor) && !isHoliday(cursor, holidaySet)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard += 1;
  }

  return count;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function maxSeverity(values: readonly RTESeverity[]): RTESeverity {
  if (values.includes("critico")) return "critico";
  if (values.includes("atencao")) return "atencao";
  return "info";
}

/** Avalia a saúde operacional de um único frete. */
export function evaluateFreightHealth(
  freight: FreightSnapshot,
  options: FreightHealthOptions = {},
): FreightHealth {
  const now = options.now ?? new Date();
  const stalledHours = options.stalledHours ?? DEFAULT_STALLED_HOURS;
  const holidays = options.holidays ?? [];

  const normalized = normalizeRTEEvents(freight.events);
  const lastEvent = lastNormalizedEvent(freight.events);
  const exceptions = collectExceptions(freight.events);

  const delivered = normalized.some((event) => event.isFinal);
  const inProgress = !delivered;

  const emission = parseDate(freight.emissionDate);
  const businessDaysElapsed = emission
    ? businessDaysBetween(emission, now, holidays)
    : 0;

  const expected = Number.isFinite(freight.expectedDeliveryDays)
    ? Math.max(0, freight.expectedDeliveryDays)
    : 0;
  const businessDaysOverdue = delivered
    ? 0
    : Math.max(0, businessDaysElapsed - expected);

  const lastEventDate = parseDate(lastEvent?.date ?? null);
  const hoursSinceLastEvent = lastEventDate
    ? Math.max(0, (now.getTime() - lastEventDate.getTime()) / 3_600_000)
    : null;

  const anomalies: FreightAnomaly[] = [];

  if (inProgress && businessDaysOverdue > 0) anomalies.push("atrasado");

  const stalledExempt = lastEvent?.phase === "no_destino";
  if (
    inProgress &&
    !stalledExempt &&
    hoursSinceLastEvent !== null &&
    hoursSinceLastEvent > stalledHours
  ) {
    anomalies.push("parado");
  }

  if (exceptions.length > 0) anomalies.push("excecao");

  const severity: RTESeverity = maxSeverity([
    ...exceptions.map((event) => event.severity),
    anomalies.includes("atrasado") || anomalies.includes("parado")
      ? "atencao"
      : "info",
  ]);

  return {
    id: freight.id,
    inProgress,
    delivered,
    businessDaysElapsed,
    businessDaysOverdue,
    hoursSinceLastEvent,
    anomalies,
    severity,
    lastEvent,
    exceptions,
  };
}

export interface FreightHealthSummary {
  readonly total: number;
  readonly delivered: number;
  readonly inProgress: number;
  readonly delayed: number;
  readonly stalled: number;
  readonly withExceptions: number;
  readonly critical: number;
  /** Percentual (0-100) de fretes sem nenhuma anomalia. */
  readonly healthyRate: number;
}

/** Avalia um lote de fretes e devolve os resultados individuais. */
export function evaluateFreightBatch(
  freights: readonly FreightSnapshot[],
  options: FreightHealthOptions = {},
): FreightHealth[] {
  return freights.map((freight) => evaluateFreightHealth(freight, options));
}

/** Agrega um lote avaliado em métricas de painel. */
export function summarizeFreightHealth(
  results: readonly FreightHealth[],
): FreightHealthSummary {
  const total = results.length;
  const delivered = results.filter((r) => r.delivered).length;
  const delayed = results.filter((r) => r.anomalies.includes("atrasado")).length;
  const stalled = results.filter((r) => r.anomalies.includes("parado")).length;
  const withExceptions = results.filter((r) =>
    r.anomalies.includes("excecao"),
  ).length;
  const critical = results.filter((r) => r.severity === "critico").length;
  const healthy = results.filter((r) => r.anomalies.length === 0).length;

  return {
    total,
    delivered,
    inProgress: total - delivered,
    delayed,
    stalled,
    withExceptions,
    critical,
    healthyRate: total === 0 ? 100 : Math.round((healthy / total) * 1000) / 10,
  };
}

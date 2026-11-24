/**
 * Validação do corpo da edge scheduled-reports (etapas 143-145 do plano QA).
 *
 * Módulo puro de propósito: sem imports remotos, para ser exercitado
 * diretamente pelo vitest (tests/contracts/scheduled-reports-fields.spec.ts).
 */
import {
  optionalString,
  requireEnum,
  requireNumber,
  requireString,
  ValidationError,
} from "../_shared/validate.ts";

export const ALLOWED_ACTIONS = [
  "create",
  "update",
  "delete",
  "list",
  "generate",
] as const;
export type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export function isAllowedAction(value: unknown): value is AllowedAction {
  return typeof value === "string" &&
    (ALLOWED_ACTIONS as readonly string[]).includes(value);
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Monta o payload de escrita de scheduled_reports campo por campo. A allowlist
 * é o espelho das colunas graváveis de src/integrations/supabase/types.ts:
 * id, user_id e timestamps nunca vêm do corpo da requisição.
 *
 * Campo fora da lista é descartado; campo ausente não entra no payload, para
 * que um update parcial não sobrescreva o que o cliente não enviou.
 */
export function buildReportFields(
  reportData: unknown,
  opts: { exigirObrigatorios: boolean },
): Record<string, unknown> {
  const fonte = asRecord(reportData);
  const campos: Record<string, unknown> = {};

  const nome = opts.exigirObrigatorios
    ? requireString(fonte, "name", { maxLength: 120 })
    : optionalString(fonte, "name");
  if (nome !== undefined) campos.name = nome;

  const tipo = opts.exigirObrigatorios
    ? requireString(fonte, "report_type", { maxLength: 64 })
    : optionalString(fonte, "report_type");
  if (tipo !== undefined) campos.report_type = tipo;

  if (fonte.frequency !== undefined && fonte.frequency !== null) {
    campos.frequency = requireEnum(fonte, "frequency", FREQUENCIES);
  }

  if ("day_of_week" in fonte) {
    campos.day_of_week = fonte.day_of_week === null
      ? null
      : requireNumber(fonte, "day_of_week", { min: 0, max: 6 });
  }

  if ("day_of_month" in fonte) {
    campos.day_of_month = fonte.day_of_month === null
      ? null
      : requireNumber(fonte, "day_of_month", { min: 1, max: 31 });
  }

  if (
    "time_of_day" in fonte && fonte.time_of_day !== null &&
    fonte.time_of_day !== ""
  ) {
    campos.time_of_day = requireString(fonte, "time_of_day", {
      pattern: TIME_OF_DAY_PATTERN,
    });
  }

  if (fonte.recipients !== undefined && fonte.recipients !== null) {
    if (!Array.isArray(fonte.recipients)) {
      throw new ValidationError(
        "recipients",
        "recipients must be an array of strings",
      );
    }
    campos.recipients = fonte.recipients
      .filter((r): r is string => typeof r === "string")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
  }

  if (fonte.filters !== undefined) {
    if (fonte.filters !== null && typeof fonte.filters !== "object") {
      throw new ValidationError("filters", "filters must be an object or null");
    }
    campos.filters = fonte.filters;
  }

  if (fonte.is_active !== undefined) {
    if (typeof fonte.is_active !== "boolean") {
      throw new ValidationError("is_active", "is_active must be a boolean");
    }
    campos.is_active = fonte.is_active;
  }

  return campos;
}

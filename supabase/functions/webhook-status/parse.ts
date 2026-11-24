import {
  optionalString,
  requireEnum,
  requireString,
  ValidationError,
} from "../_shared/validate.ts";

export const ALLOWED_ACTIONS = [
  "notify_status_change",
  "list_webhooks",
] as const;

export interface StatusChangeData {
  entrega_id: string;
  new_status: string;
  old_status?: string;
  numero_entrega?: string;
  codigo_rastreamento?: string;
}

export type ParsedWebhookStatusRequest =
  | { action: "notify_status_change"; data: StatusChangeData }
  | { action: "list_webhooks" };

/**
 * B-04: `data` era desestruturado antes de existir — corpo sem `data` devolvia 500,
 * e `new_status` ausente fazia `events.includes(undefined)` não casar webhook
 * nenhum: a notificação morria em silêncio, o que é pior que o erro visível.
 */
export function parseWebhookStatusInput(
  body: Record<string, unknown>,
): ParsedWebhookStatusRequest {
  const action = requireEnum(body, "action", ALLOWED_ACTIONS);
  if (action === "list_webhooks") return { action };

  const data = requireRecord(body, "data");
  return {
    action,
    data: {
      entrega_id: requireString(data, "entrega_id"),
      new_status: requireString(data, "new_status"),
      old_status: optionalString(data, "old_status"),
      numero_entrega: optionalString(data, "numero_entrega"),
      codigo_rastreamento: optionalString(data, "codigo_rastreamento"),
    },
  };
}

export function requireRecord(
  obj: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  const val = obj[field];
  if (val === null || typeof val !== "object" || Array.isArray(val)) {
    throw new ValidationError(
      field,
      `${field} is required and must be an object`,
    );
  }
  return val as Record<string, unknown>;
}

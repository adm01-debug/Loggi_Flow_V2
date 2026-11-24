/**
 * Validação dos identificadores de rastreio da Lalamove (etapa 152 / achado B-04).
 *
 * Módulo puro: pode ser importado por testes sem carregar deno.land.
 */

import { requireString } from "../_shared/validate.ts";

/** Mesmo formato aceito para o `orderId` do parceiro em `lalamove-api/parse.ts` (etapa 149). */
export const ID_FORMAT = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
export const MAX_ID_LENGTH = 64;

function asObject(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function parseOrderId(body: unknown): string {
  return requireString(asObject(body), "orderId", {
    pattern: ID_FORMAT,
    minLength: 1,
    maxLength: MAX_ID_LENGTH,
  });
}

export function parseDriverId(body: unknown): string {
  return requireString(asObject(body), "driverId", {
    pattern: ID_FORMAT,
    minLength: 1,
    maxLength: MAX_ID_LENGTH,
  });
}

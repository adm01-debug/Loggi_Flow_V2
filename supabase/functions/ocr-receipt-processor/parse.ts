/**
 * Validação da entrada do comprovante (etapa 155 / achado B-04).
 *
 * Módulo puro: pode ser importado por testes sem carregar deno.land/esm.sh.
 */

import { requireString } from "../_shared/validate.ts";

/**
 * O único chamador (`DeliveryReceiptUpload.tsx:53-54`) grava em
 * `receipts/<id>_<timestamp>.<ext>`. Exigir a pasta e permitir **uma** barra
 * fecha leitura de qualquer outro caminho do bucket (inclusive `../`).
 */
export const STORAGE_PATH_PATTERN =
  /^receipts\/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/;
export const MAX_STORAGE_PATH_LENGTH = 300;
export const DELIVERY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{9,63}$/;

export interface ReceiptRequest {
  storagePath: string;
  deliveryId: string;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function parseStoragePath(body: unknown): string {
  return requireString(asObject(body), "storage_path", {
    maxLength: MAX_STORAGE_PATH_LENGTH,
    pattern: STORAGE_PATH_PATTERN,
  });
}

export function parseDeliveryId(body: unknown): string {
  return requireString(asObject(body), "delivery_id", {
    pattern: DELIVERY_ID_PATTERN,
  });
}

/** Usado pelo `validateContract` (auditoria) e para obter os valores tipados antes do download. */
export function parseReceiptRequest(body: unknown): ReceiptRequest {
  const input = asObject(body);
  return {
    storagePath: parseStoragePath(input),
    deliveryId: parseDeliveryId(input),
  };
}

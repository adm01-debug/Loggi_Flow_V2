/**
 * Validação do corpo da cotação do Melhor Envio (etapa 151 / achado B-04).
 *
 * Módulo puro: pode ser importado por testes sem carregar esm.sh/deno.land.
 */

import {
  requireNumber,
  requireString,
  ValidationError,
} from "../_shared/validate.ts";

const CEP = /^\d{8}$/;
const MAX_VOLUMES = 50;
const MAX_QUANTITY = 999;
const DIMENSION = { min: 1, max: 500 };
const WEIGHT = { min: 0.001, max: 1000 };
const DECLARED_VALUE = { min: 0, max: 1_000_000 };

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(field, `${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function parseEndpoint(params: Record<string, unknown>, field: "from" | "to") {
  const endpoint = asRecord(params[field], field);
  const raw = endpoint.postal_code;
  const key = `${field}.postal_code`;
  if (raw === undefined || raw === null) {
    throw new ValidationError(key, `${key} is required`);
  }
  const digits = String(raw).replace(/\D/g, "");
  const postalCode = requireString({ [key]: digits }, key, {
    pattern: CEP,
    minLength: 8,
    maxLength: 8,
  });
  return { ...endpoint, postal_code: postalCode };
}

function parseVolume(item: unknown, key: string, index: number) {
  const prefix = `${key}[${index}]`;
  const volume = asRecord(item, prefix);
  try {
    return {
      ...volume,
      width: requireNumber(volume, "width", DIMENSION),
      height: requireNumber(volume, "height", DIMENSION),
      length: requireNumber(volume, "length", DIMENSION),
      weight: requireNumber(volume, "weight", WEIGHT),
      insurance_value:
        volume.insurance_value === undefined || volume.insurance_value === null
          ? 0
          : requireNumber(volume, "insurance_value", DECLARED_VALUE),
      quantity: volume.quantity === undefined || volume.quantity === null
        ? 1
        : Math.trunc(
          requireNumber(volume, "quantity", { min: 1, max: MAX_QUANTITY }),
        ),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ValidationError(`${prefix}.${error.field}`, error.message);
    }
    throw error;
  }
}

function parseVolumes(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const key = Array.isArray(params.products) || params.products !== undefined
    ? "products"
    : "volumes";
  const raw = params[key];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError(
      key,
      `${key} is required and must be a non-empty array`,
    );
  }
  if (raw.length > MAX_VOLUMES) {
    throw new ValidationError(
      key,
      `${key} must have at most ${MAX_VOLUMES} items`,
    );
  }
  return {
    ...params,
    [key]: raw.map((item, index) => parseVolume(item, key, index)),
  };
}

/**
 * Valida e normaliza o corpo de `calcularFrete`.
 * CEPs viram 8 dígitos; peso, dimensões, valor declarado e quantidade viram números com limites.
 */
export function parseMelhorEnvioQuote(
  params: unknown,
): Record<string, unknown> {
  const body = asRecord(params, "params");
  const withVolumes = parseVolumes(body);
  return {
    ...withVolumes,
    from: parseEndpoint(body, "from"),
    to: parseEndpoint(body, "to"),
  };
}

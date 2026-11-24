/**
 * Validação de `instance`, `phone` e `message` (etapa 154 / achado B-04).
 *
 * Módulo puro: pode ser importado por testes sem carregar deno.land/esm.sh.
 */

import {
  optionalString,
  requireString,
  ValidationError,
} from "../_shared/validate.ts";

/** E.164 exige DDI: 12 a 15 dígitos com `+` opcional. Sem normalização "no melhor esforço". */
export const PHONE_PATTERN = /^\+?\d{12,15}$/;
/** Limite de texto do próprio WhatsApp. */
export const MAX_MESSAGE_LENGTH = 4096;
export const MAX_FIELD_LENGTH = 200;
export const INSTANCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export interface SendTextRequest {
  instance: string;
  phone: string;
  message: string;
}

export interface SendCotacaoRequest {
  instance: string;
  phone: string;
  transportadora: string | undefined;
  origem: string | undefined;
  destino: string | undefined;
  peso: string | undefined;
  volumes: string | undefined;
  valor_mercadoria: string | undefined;
}

export interface StatusRequest {
  instance: string;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/** `optionalString` do `_shared` não aceita `maxLength`: o limite dos campos da cotação é aplicado aqui. */
function optionalLimitedString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = optionalString(input, field);
  if (value !== undefined && value.length > MAX_FIELD_LENGTH) {
    throw new ValidationError(
      field,
      `${field} must be at most ${MAX_FIELD_LENGTH} characters`,
    );
  }
  return value;
}

/** `instance` escolhe qual conexão da empresa fala com o cliente: lista fechada, nunca texto livre. */
export function parseInstance(
  data: unknown,
  allowedInstances: readonly string[],
): string {
  const input = asObject(data);
  const instance = requireString(input, "instance", {
    maxLength: 64,
    pattern: INSTANCE_PATTERN,
  });
  if (!allowedInstances.includes(instance)) {
    throw new ValidationError(
      "instance",
      `instance must be one of: ${allowedInstances.join(", ")}`,
    );
  }
  return instance;
}

export function parsePhone(data: unknown): string {
  return requireString(asObject(data), "phone", { pattern: PHONE_PATTERN });
}

export function parseSendTextRequest(
  data: unknown,
  allowedInstances: readonly string[],
): SendTextRequest {
  const input = asObject(data);
  return {
    instance: parseInstance(input, allowedInstances),
    phone: parsePhone(input),
    message: requireString(input, "message", { maxLength: MAX_MESSAGE_LENGTH }),
  };
}

export function parseCotacaoRequest(
  data: unknown,
  allowedInstances: readonly string[],
): SendCotacaoRequest {
  const input = asObject(data);
  return {
    instance: parseInstance(input, allowedInstances),
    phone: parsePhone(input),
    transportadora: optionalLimitedString(input, "transportadora"),
    origem: optionalLimitedString(input, "origem"),
    destino: optionalLimitedString(input, "destino"),
    peso: optionalLimitedString(input, "peso"),
    volumes: optionalLimitedString(input, "volumes"),
    valor_mercadoria: optionalLimitedString(input, "valor_mercadoria"),
  };
}

export function parseStatusRequest(
  data: unknown,
  allowedInstances: readonly string[],
): StatusRequest {
  return { instance: parseInstance(data, allowedInstances) };
}

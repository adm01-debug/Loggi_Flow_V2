import { fetchWithTimeout } from "./fetch-with-timeout.ts";
import { log } from "./logger.ts";

export const DEFAULT_INVOKE_TIMEOUT_MS = 10_000;

const FUNCTION_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
const TIMEOUT_MESSAGE = /timed out after/i;

type DenoEnv = { env: { get(key: string): string | undefined } };

export interface InvokeFunctionOptions {
  timeoutMs?: number;
}

export type InvokeFunctionFailureReason =
  | "config"
  | "timeout"
  | "network"
  | "http";

export type InvokeFunctionResult =
  | { ok: true; status: number; data: unknown }
  | {
    ok: false;
    reason: InvokeFunctionFailureReason;
    status?: number;
    error: string;
    data?: unknown;
  };

function readEnv(key: string): string | undefined {
  // `Deno` não existe no runtime do vitest; o acesso opcional mantém o módulo importável.
  return (globalThis as { Deno?: DenoEnv }).Deno?.env.get(key);
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Chama outra edge function do mesmo projeto com tempo limite.
 * Nunca lança: devolve `{ ok: false, reason }` para o chamador decidir.
 */
export async function invokeFunction(
  name: string,
  body?: unknown,
  options: InvokeFunctionOptions = {},
): Promise<InvokeFunctionResult> {
  if (!FUNCTION_NAME_PATTERN.test(name)) {
    log.warn("invokeFunction: nome inválido", { name });
    return {
      ok: false,
      reason: "config",
      error: `nome de função inválido: ${name}`,
    };
  }

  const baseUrl = readEnv("SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!baseUrl || !serviceKey) {
    log.warn("invokeFunction: configuração ausente", { name });
    return {
      ok: false,
      reason: "config",
      error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente",
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_INVOKE_TIMEOUT_MS;
  const url = `${baseUrl.replace(/\/+$/, "")}/functions/v1/${name}`;
  const startedAt = Date.now();

  try {
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
      timeout: timeoutMs,
    });
    const data = await readBody(response);
    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      log.warn("invokeFunction: resposta de erro", {
        name,
        status: response.status,
        durationMs,
      });
      return {
        ok: false,
        reason: "http",
        status: response.status,
        error: `função ${name} respondeu ${response.status}`,
        data,
      };
    }

    log.info("invokeFunction: ok", {
      name,
      status: response.status,
      durationMs,
    });
    return { ok: true, status: response.status, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const reason = TIMEOUT_MESSAGE.test(message) ? "timeout" : "network";
    log.warn("invokeFunction: falhou", {
      name,
      reason,
      durationMs: Date.now() - startedAt,
    });
    return { ok: false, reason, error: message };
  }
}

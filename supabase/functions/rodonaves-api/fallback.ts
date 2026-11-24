/**
 * Fallbacks de 403 do gateway Rodonaves.
 *
 * O JWT da operação é `isMaster=N`, então tudo que pertence ao escopo de
 * gestão interna da RTE responde 403 (ver docs/ANALISE_API_RODONAVES.md e a
 * documentação do MCP v6.9.0). O padrão do MCP oficial é nunca devolver o 403
 * cru: a chamada bloqueada é substituída pela rota alternativa e o payload
 * volta marcado com `_fallback` (rota usada) e `_note` (explicação).
 */

export interface FallbackInfo {
  /** Rota (ou origem local) que substituiu a chamada bloqueada. */
  readonly fallback: string;
  /** Explicação exibida ao operador junto do resultado. */
  readonly note: string;
}

/** Identifica o erro de escopo bloqueado (HTTP 403) da RTE. */
export function isScopeBlockedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "RTE_SCOPE_BLOCKED"
  );
}

/**
 * Anexa `_fallback`/`_note` ao payload. Listas são reempacotadas em
 * `{ data: [...] }` para não perder os registros nem a explicação.
 */
export function withFallbackMeta(
  value: unknown,
  info: FallbackInfo,
): Record<string, unknown> {
  const meta = { _fallback: info.fallback, _note: info.note };
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>), ...meta };
  }
  return { data: value, ...meta };
}

/** Payload devolvido quando a rota bloqueada não tem alternativa conhecida. */
export function blockedPayload(info: FallbackInfo): Record<string, unknown> {
  return { _status: 403, _fallback: info.fallback, _note: info.note };
}

/**
 * Executa a rota principal e troca APENAS o 403 pela alternativa; qualquer
 * outro erro (timeout, 5xx) continua subindo para o handler.
 */
export async function withFallback(
  primary: () => Promise<unknown>,
  info: FallbackInfo,
  alternative?: () => Promise<unknown>,
): Promise<unknown> {
  try {
    return await primary();
  } catch (error) {
    if (!isScopeBlockedError(error)) throw error;
    if (!alternative) return blockedPayload(info);
    return withFallbackMeta(await alternative(), info);
  }
}

/** Executa as tarefas com concorrência limitada, preservando a ordem. */
export async function mapWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const output = new Array<R>(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await run(items[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

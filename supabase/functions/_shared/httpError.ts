/**
 * Resposta de erro padrão das edge functions: o detalhe do erro fica no log e
 * o cliente recebe apenas um código genérico (sem texto do Postgres/PostgREST,
 * que nomearia tabela, coluna, restrição e policy de RLS).
 */

import { log } from "./logger.ts";
import { ValidationError, validationErrorResponse } from "./validate.ts";

/** Erro de entrada do chamador continua devolvendo o campo violado; o resto vira 500 genérico. */
export function internalErrorResponse(
  err: unknown,
  headers: Record<string, string>,
  tag: string,
): Response {
  if (err instanceof ValidationError) {
    return validationErrorResponse(err, headers);
  }

  log.error(`[${tag}] Error:`, { error: String(err) });

  return new Response(
    JSON.stringify({ error: "INTERNAL_ERROR" }),
    {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    },
  );
}

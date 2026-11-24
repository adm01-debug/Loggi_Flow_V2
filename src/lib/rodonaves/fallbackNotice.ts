/**
 * Extrai o aviso de rota alternativa devolvido pelo gateway `rodonaves-api`.
 *
 * Quando uma rota da RTE responde 403, o gateway `rodonaves-api` troca a
 * chamada pela alternativa liberada e marca o payload com `_fallback` (rota
 * usada) e `_note` (explicação). Sem isso o operador não sabe que o dado
 * veio de outra rota — comprovante padrão em vez de HQ, destino inferido das
 * etapas de rastreio, fator de cubagem de mercado em vez do do cliente.
 */

export interface RTEFallbackNotice {
  /** Rota (ou origem local) que substituiu a chamada bloqueada. */
  readonly route: string;
  /** Explicação exibida ao operador. */
  readonly note: string;
  /** `true` quando nenhuma alternativa existia e a resposta sinaliza 403. */
  readonly blocked: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Procura `_note` no payload e nos níveis `data` abaixo dele.
 * Devolve `null` quando a resposta veio da rota principal.
 */
export function extractFallbackNotice(
  payload: unknown,
): RTEFallbackNotice | null {
  let node = asRecord(payload);
  for (let depth = 0; node && depth < 4; depth += 1) {
    const note = typeof node._note === "string" ? node._note : null;
    if (note) {
      return {
        route: typeof node._fallback === "string" ? node._fallback : "alternativa",
        note,
        blocked: node._status === 403,
      };
    }
    node = asRecord(node.data);
  }
  return null;
}

/** Texto curto para o toast de aviso. */
export function fallbackNoticeMessage(notice: RTEFallbackNotice): string {
  return notice.blocked
    ? `Rota sem alternativa liberada (${notice.route}): ${notice.note}`
    : `Rota alternativa ${notice.route}: ${notice.note}`;
}

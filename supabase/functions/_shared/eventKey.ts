// Chave deterministica de evento para dedupe de webhooks (etapa 138, achado B-02).
// Modulo puro de proposito: nenhum import remoto, para ser testavel fora do Deno.
// Regra: o mesmo evento tem de gerar sempre a mesma chave. Sem identificador estavel
// o chamador recusa o evento (400) em vez de inventar valor.

export type EventKeyPart = string | number | null | undefined;

export interface EventKey {
  /** Rotulo do produtor/evento, usado pelo helper `claimIdempotencyKey`. */
  provider: string;
  /** Identificadores estaveis do evento, normalizados e unidos por `-`. */
  id: string;
  /** `provider:id` - a chave completa. */
  key: string;
}

function normalizePart(part: EventKeyPart): string | null {
  if (part === null || part === undefined) return null;
  const texto = String(part).trim();
  return texto.length > 0 ? texto : null;
}

/** JSON canonico: chaves ordenadas e sem espaco - payloads iguais geram o mesmo texto. */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entradas = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entradas.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

/** SHA-256 (32 hex) do corpo canonico. Ultimo recurso para payload sem campo estavel. */
export async function bodyHash(body: unknown): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJson(body)),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Monta a chave de dedupe de um evento de webhook.
 *
 * @param provider rotulo do produtor (ex.: `lalamove`, `carrier:RODONAVES`)
 * @param parts campos identificadores, na ordem; vazios sao descartados
 * @param fallbackBody corpo do payload - entra como hash (deterministico) apenas
 *   quando `parts` nao tem nenhum valor. Nunca valor aleatorio nem relogio.
 * @returns a chave, ou `null` quando o evento nao tem como ser identificado -
 *   nesse caso o chamador responde 400 e registra, nao processa.
 */
export async function buildEventKey(
  provider: string,
  parts: EventKeyPart[],
  fallbackBody?: unknown,
): Promise<EventKey | null> {
  const validos = parts.map(normalizePart).filter((p): p is string => p !== null);

  if (validos.length === 0) {
    if (fallbackBody === undefined) return null;
    validos.push(`sha256-${await bodyHash(fallbackBody)}`);
  }

  const id = validos.join("-");
  return { provider, id, key: `${provider}:${id}` };
}

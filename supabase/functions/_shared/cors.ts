/**
 * Utilitários de CORS compartilhados pelas edge functions.
 *
 * `ALLOWED_ORIGINS` aceita uma lista separada por vírgula. Quando a origem da
 * requisição estiver na lista, ela é ecoada (permitindo credenciais); caso
 * contrário cai no primeiro item configurado ou em `*`.
 */

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function allowedOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGINS") || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/** Headers CORS estáticos (compatibilidade com funções antigas). */
export const corsHeaders: Record<string, string> = {
  ...BASE_HEADERS,
  "Access-Control-Allow-Origin": allowedOrigins()[0] || "*",
};

/** Headers CORS resolvidos a partir da origem da requisição. */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const list = allowedOrigins();
  const origin = req?.headers.get("origin") || "";

  if (list.includes("*")) {
    return { ...BASE_HEADERS, "Access-Control-Allow-Origin": "*" };
  }
  if (origin && list.includes(origin)) {
    return {
      ...BASE_HEADERS,
      "Access-Control-Allow-Origin": origin,
      "Vary": "Origin",
    };

  }
  return { ...BASE_HEADERS, "Access-Control-Allow-Origin": list[0] || "*", "Vary": "Origin" };
}

/**
 * Sobrecarga 1: `corsResponse(req)` → preflight OPTIONS 204.
 * Sobrecarga 2: `corsResponse(payload, extraHeaders?)` → JSON 200 com CORS.
 */
export function corsResponse(req: Request): Response;
export function corsResponse(payload: unknown, extraHeaders?: Record<string, string>): Response;
export function corsResponse(
  reqOrPayload: Request | unknown,
  extraHeaders: Record<string, string> = {},
): Response {
  if (reqOrPayload instanceof Request) {
    return new Response(null, { status: 204, headers: getCorsHeaders(reqOrPayload) });
  }
  return new Response(JSON.stringify(reqOrPayload), {
    status: 200,
    headers: { ...getCorsHeaders(), "Content-Type": "application/json", ...extraHeaders },
  });
}

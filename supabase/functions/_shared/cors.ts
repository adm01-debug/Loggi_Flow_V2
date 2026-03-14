/**
 * Shared CORS configuration for edge functions.
 * In production, restrict to your actual domain(s).
 */
const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || ["*"];

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get("origin") || "";
  
  // If wildcard is configured, allow all
  if (ALLOWED_ORIGINS.includes("*")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    };
  }
  
  // Check if origin is in allowed list
  const allowed = ALLOWED_ORIGINS.some(
    (o) => o.trim() === origin || origin.endsWith(o.trim())
  );

  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Vary": "Origin",
  };
}

export function corsResponse(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}

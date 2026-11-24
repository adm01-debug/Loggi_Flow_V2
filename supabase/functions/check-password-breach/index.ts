import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { log } from "../_shared/logger.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const { prefix } = await req.json();

    // k-anonymity: o cliente envia apenas o prefixo de 5 hex do SHA-1 (etapa 007).
    // A senha completa nunca chega aqui. Devolvemos os sufixos + contagens para
    // o cliente comparar localmente.
    if (!prefix || typeof prefix !== "string" || !/^[0-9A-Fa-f]{5}$/.test(prefix)) {
      return new Response(
        JSON.stringify({ error: "Valid 5-hex prefix is required" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    const normalized = prefix.toUpperCase();
    log.info(`Checking password hash prefix: ${normalized}...`);

    const response = await safeFetch(
      `https://api.pwnedpasswords.com/range/${normalized}`,
      { headers: { "User-Agent": "LogiFlow-PasswordCheck" } },
    );

    if (!response.ok) {
      log.error(`HIBP API error: ${response.status}`);
      // fail open: sem lista, sem parecer pwned
      return new Response(
        JSON.stringify({ hashes: [] }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    const text = await response.text();
    const hashes = text
      .split("\n")
      .filter((l) => l.includes(":"))
      .map((l) => {
        const [suffix, count] = l.split(":");
        return { suffix: suffix.trim(), count: parseInt(count.trim(), 10) || 0 };
      });

    log.info(`HIBP returned ${hashes.length} suffix entries for prefix ${normalized}`);

    return new Response(
      JSON.stringify({ hashes }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error("Unexpected error", { error: String(error) });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
